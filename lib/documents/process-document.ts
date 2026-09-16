/**
 * Utility functions for document text extraction, chunking, and embedding generation.
 */

export interface DocumentTextChunk {
  content: string;
  metadata: {
    chunkIndex: number;
    heading?: string;
    startOffset: number;
    endOffset: number;
  };
}

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
  chunkSize = 1200,
  overlap = 180,
): string[] {
  return chunkDocumentText(text, chunkSize, overlap).map(
    (chunk) => chunk.content,
  );
}

export function chunkDocumentText(
  text: string,
  chunkSize = 1200,
  overlap = 180,
): DocumentTextChunk[] {
  const cleaned = text.replace(/\r\n/g, "\n").trim();
  if (!cleaned) return [];

  const sections = splitIntoSections(cleaned);
  const chunks: DocumentTextChunk[] = [];
  let currentChunk = "";
  let currentHeading: string | undefined;
  let currentStart = 0;

  const pushChunk = (content: string, heading: string | undefined) => {
    const trimmed = content.trim();
    if (trimmed.length <= 5) return;

    const startOffset = cleaned.indexOf(trimmed, currentStart);
    const safeStart = startOffset >= 0 ? startOffset : currentStart;
    const endOffset = safeStart + trimmed.length;

    chunks.push({
      content: heading ? `${heading}\n\n${trimmed}` : trimmed,
      metadata: {
        chunkIndex: chunks.length,
        heading,
        startOffset: safeStart,
        endOffset,
      },
    });

    currentStart = endOffset;
  };

  for (const section of sections) {
    const heading = section.heading;
    const paragraphs = section.content
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    for (const para of paragraphs) {
      if (currentHeading && heading !== currentHeading && currentChunk) {
        pushChunk(currentChunk, currentHeading);
        currentChunk = "";
      }

      currentHeading = heading;

      if (currentChunk.length + para.length <= chunkSize) {
        currentChunk += (currentChunk ? "\n\n" : "") + para;
        continue;
      }

      if (currentChunk) {
        pushChunk(currentChunk, currentHeading);
      }

      if (para.length > chunkSize) {
        for (const piece of splitLongText(para, chunkSize, overlap)) {
          pushChunk(piece, heading);
        }
        currentChunk = "";
      } else {
        currentChunk = para;
      }
    }
  }

  if (currentChunk.trim()) {
    pushChunk(currentChunk, currentHeading);
  }

  return chunks;
}

function splitIntoSections(text: string): Array<{
  heading?: string;
  content: string;
}> {
  const lines = text.split("\n");
  const sections: Array<{ heading?: string; content: string }> = [];
  let heading: string | undefined;
  let body: string[] = [];

  const flush = () => {
    const content = body.join("\n").trim();
    if (content) sections.push({ heading, content });
    body = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flush();
      heading = headingMatch[2].trim();
      continue;
    }

    body.push(line);
  }

  flush();
  return sections.length > 0 ? sections : [{ content: text }];
}

function splitLongText(text: string, chunkSize: number, overlap: number) {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const hardEnd = Math.min(start + chunkSize, text.length);
    const softEnd = findSoftBoundary(text, start, hardEnd);
    chunks.push(text.slice(start, softEnd).trim());

    if (softEnd >= text.length) break;
    start = Math.max(softEnd - overlap, start + 1);
  }

  return chunks;
}

function findSoftBoundary(text: string, start: number, hardEnd: number) {
  const window = text.slice(start, hardEnd);
  const candidates = [". ", "။", "\n", " "];

  for (const marker of candidates) {
    const index = window.lastIndexOf(marker);
    if (index > chunkMinBoundary(window.length)) {
      return start + index + marker.length;
    }
  }

  return hardEnd;
}

function chunkMinBoundary(length: number) {
  return Math.floor(length * 0.55);
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
