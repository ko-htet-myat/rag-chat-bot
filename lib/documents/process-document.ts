/**
 * Utility functions for document text extraction, chunking, and embedding generation.
 */

export function extractTextFromFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
): string {
  const lowerName = fileName.toLowerCase();

  // Plain text, markdown, json, csv, code files
  if (
    mimeType.includes("text") ||
    mimeType.includes("json") ||
    mimeType.includes("csv") ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md") ||
    lowerName.endsWith(".json") ||
    lowerName.endsWith(".csv") ||
    lowerName.endsWith(".log") ||
    lowerName.endsWith(".html") ||
    lowerName.endsWith(".xml")
  ) {
    return buffer.toString("utf-8");
  }

  // Basic PDF text extraction
  if (lowerName.endsWith(".pdf") || mimeType.includes("pdf")) {
    const raw = buffer.toString("latin1");
    const matches = raw.match(/BT[\s\S]*?ET/g);
    if (matches && matches.length > 0) {
      const texts: string[] = [];
      for (const m of matches) {
        const textParts = m.match(/\((.*?)\)/g);
        if (textParts) {
          texts.push(textParts.map((t) => t.slice(1, -1)).join(" "));
        }
      }
      if (texts.length > 0) {
        return texts.join("\n");
      }
    }
    // Fallback: extract printable ASCII characters
    const printable = raw
      .replace(/[^\x20-\x7E\n\r\t]/g, " ")
      .replace(/\s+/g, " ");
    return printable.trim();
  }

  // Fallback to utf-8 string
  return buffer.toString("utf-8");
}

export function chunkText(
  text: string,
  chunkSize = 600,
  overlap = 100,
): string[] {
  const cleaned = text.replace(/\r\n/g, "\n").trim();
  if (!cleaned) return [];

  const paragraphs = cleaned.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    if (currentChunk.length + trimmed.length <= chunkSize) {
      currentChunk += (currentChunk ? "\n\n" : "") + trimmed;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }

      if (trimmed.length > chunkSize) {
        let i = 0;
        while (i < trimmed.length) {
          const end = Math.min(i + chunkSize, trimmed.length);
          chunks.push(trimmed.slice(i, end));
          i += Math.max(1, chunkSize - overlap);
        }
        currentChunk = "";
      } else {
        currentChunk = trimmed;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter((c) => c.trim().length > 5);
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: text.slice(0, 8000),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.data?.[0]?.embedding) {
          return data.data[0].embedding;
        }
      }
    } catch {
      // Fallback below
    }
  }

  // Fallback: 1536-dimensional normalized vector
  const vector = new Array(1536).fill(0);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    const index = (code * 31 + i) % 1536;
    vector[index] += 1;
  }
  const magnitude =
    Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vector.map((v) => Number((v / magnitude).toFixed(6)));
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
