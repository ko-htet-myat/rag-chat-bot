import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { and, count, desc, eq } from "drizzle-orm";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Book02Icon,
  File01Icon,
  Briefcase01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { bots, documentChunks, documents, knowledgeBases } from "@/db/schema";
import { Card } from "@/components/ui/card";
import {
  DocumentUploader,
  DocumentListTable,
  type DocumentRowItem,
} from "@/features/knowledge/components";

interface KnowledgeDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: KnowledgeDetailPageProps) {
  const { id } = await params;
  const [kb] = await db
    .select({ name: knowledgeBases.name })
    .from(knowledgeBases)
    .where(eq(knowledgeBases.id, id));

  return {
    title: kb ? `${kb.name} | Knowledge Base` : "Knowledge Base",
  };
}

export default async function KnowledgeDetailPage({
  params,
}: KnowledgeDetailPageProps) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect(`/sign-in?callbackURL=/knowledge/${id}`);
  }

  const [row] = await db
    .select({
      kb: knowledgeBases,
      bot: bots,
    })
    .from(knowledgeBases)
    .innerJoin(bots, eq(knowledgeBases.botId, bots.id))
    .where(and(eq(knowledgeBases.id, id), eq(bots.userId, session.user.id)));

  if (!row) {
    notFound();
  }

  const rawDocs = await db
    .select({
      id: documents.id,
      name: documents.name,
      sourceType: documents.sourceType,
      mimeType: documents.mimeType,
      size: documents.size,
      status: documents.status,
      createdAt: documents.createdAt,
      chunksCount: count(documentChunks.id),
    })
    .from(documents)
    .leftJoin(documentChunks, eq(documentChunks.documentId, documents.id))
    .where(eq(documents.knowledgeBaseId, id))
    .groupBy(documents.id)
    .orderBy(desc(documents.createdAt));

  const formattedDocs: DocumentRowItem[] = rawDocs.map((doc) => ({
    id: doc.id,
    name: doc.name,
    sourceType: doc.sourceType,
    mimeType: doc.mimeType,
    size: doc.size,
    status: doc.status,
    chunksCount: Number(doc.chunksCount),
    createdAt: doc.createdAt.toLocaleDateString(),
  }));

  const totalChunks = formattedDocs.reduce((sum, d) => sum + d.chunksCount, 0);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/knowledge"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
          Back to Knowledge Bases
        </Link>
      </div>

      {/* Header section */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
            <HugeiconsIcon icon={Book02Icon} size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {row.kb.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {row.kb.description || "No description provided."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/bots/${row.bot.id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <HugeiconsIcon
              icon={Briefcase01Icon}
              size={14}
              className="text-muted-foreground"
            />
            <span>
              Target Bot:{" "}
              <strong className="text-foreground font-semibold">
                {row.bot.name}
              </strong>
            </span>
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="rounded-xl border-border/70 bg-card/60 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <HugeiconsIcon icon={File01Icon} size={16} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Documents</div>
              <div className="text-lg font-semibold text-foreground">
                {formattedDocs.length}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  ({totalChunks} chunks)
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="rounded-xl border-border/70 bg-card/60 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <HugeiconsIcon icon={Briefcase01Icon} size={16} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Connected Bot</div>
              <div className="text-sm font-semibold text-foreground truncate max-w-[160px]">
                {row.bot.name}
              </div>
            </div>
          </div>
        </Card>

        <Card className="rounded-xl border-border/70 bg-card/60 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <HugeiconsIcon icon={Clock01Icon} size={16} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Last Updated</div>
              <div className="text-xs font-semibold text-foreground">
                {row.kb.updatedAt.toLocaleDateString()}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Document Upload Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Upload Documents
          </h2>
        </div>
        <DocumentUploader knowledgeBaseId={row.kb.id} />
      </div>

      {/* Existing documents list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Uploaded Content ({formattedDocs.length})
          </h2>
        </div>
        <DocumentListTable
          documents={formattedDocs}
          knowledgeBaseId={row.kb.id}
        />
      </div>
    </div>
  );
}
