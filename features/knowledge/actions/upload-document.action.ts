"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { bots, documentChunks, documents, knowledgeBases } from "@/db/schema";
import { embedText } from "@/ai/runtime/embeddings";
import {
  chunkText,
  extractTextFromFile,
} from "@/lib/documents/process-document";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".pdf", ".txt", ".md", ".csv", ".json"]);

export interface UploadDocumentResult {
  success: boolean;
  error?: string;
  document?: {
    id: string;
    name: string;
    chunksCount: number;
  };
}

export async function uploadDocumentAction(
  formData: FormData,
): Promise<UploadDocumentResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  const knowledgeBaseIdValue = formData.get("knowledgeBaseId");
  const fileValue = formData.get("file");
  const knowledgeBaseId =
    typeof knowledgeBaseIdValue === "string" ? knowledgeBaseIdValue : "";
  const file = fileValue instanceof File ? fileValue : null;

  if (!knowledgeBaseId || !file) {
    return {
      success: false,
      error: "Knowledge base ID and file are required.",
    };
  }

  if (!z.string().uuid().safeParse(knowledgeBaseId).success) {
    return { success: false, error: "Invalid knowledge base ID." };
  }

  const lastDot = file.name.lastIndexOf(".");
  const extension = lastDot >= 0 ? file.name.slice(lastDot).toLowerCase() : "";
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return {
      success: false,
      error: "Unsupported file type. Upload PDF, TXT, MD, CSV, or JSON files.",
    };
  }

  if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
    return {
      success: false,
      error: "File must be between 1 byte and 10 MB.",
    };
  }

  const safeFileName = file.name.split(/[\\/]/).pop()?.trim() ?? "";
  if (!safeFileName || safeFileName.length > 255) {
    return { success: false, error: "Invalid file name." };
  }

  // Verify ownership: knowledgeBase belongs to a bot owned by the authenticated user
  const [kb] = await db
    .select({ id: knowledgeBases.id })
    .from(knowledgeBases)
    .innerJoin(bots, eq(knowledgeBases.botId, bots.id))
    .where(
      and(
        eq(knowledgeBases.id, knowledgeBaseId),
        eq(bots.userId, session.user.id),
      ),
    );

  if (!kb) {
    return {
      success: false,
      error: "Knowledge base not found or you do not have permission.",
    };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Create document record with status "processing"
    const [doc] = await db
      .insert(documents)
      .values({
        knowledgeBaseId,
        name: safeFileName,
        sourceType: "upload",
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        status: "processing",
      })
      .returning();

    // 2. Extract text and split into chunks
    const rawText = extractTextFromFile(buffer, safeFileName, file.type);
    const chunks = chunkText(rawText);

    if (chunks.length === 0) {
      chunks.push(`Document: ${safeFileName}`);
    }

    // 3. Generate embeddings and insert chunks into document_chunks
    for (let i = 0; i < chunks.length; i++) {
      const chunkContent = chunks[i];
      const embedding = await embedText(chunkContent);

      await db.insert(documentChunks).values({
        documentId: doc.id,
        content: chunkContent,
        chunkIndex: i,
        embedding,
        metadata: {
          fileName: safeFileName,
          chunkIndex: i,
          totalChunks: chunks.length,
        },
      });
    }

    // 4. Update document status to ready
    await db
      .update(documents)
      .set({ status: "ready", updatedAt: new Date() })
      .where(eq(documents.id, doc.id));

    revalidatePath(`/knowledge/${knowledgeBaseId}`);
    revalidatePath("/knowledge");

    return {
      success: true,
      document: {
        id: doc.id,
        name: doc.name,
        chunksCount: chunks.length,
      },
    };
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to process document";
    return { success: false, error: errorMessage };
  }
}
