import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Book02Icon,
  File01Icon,
  Briefcase01Icon,
  CloudUploadIcon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { bots, documents, knowledgeBases } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
    redirect("/sign-in");
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

  const docs = await db
    .select()
    .from(documents)
    .where(eq(documents.knowledgeBaseId, id))
    .orderBy(documents.createdAt);

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
            <HugeiconsIcon icon={Briefcase01Icon} size={14} className="text-muted-foreground" />
            <span>Target Bot: <strong className="text-foreground font-semibold">{row.bot.name}</strong></span>
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
              <div className="text-xs text-muted-foreground">Total Documents</div>
              <div className="text-lg font-semibold text-foreground">{docs.length}</div>
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
              <div className="text-sm font-semibold text-foreground truncate max-w-[160px]">{row.bot.name}</div>
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
              <div className="text-xs font-semibold text-foreground">{row.kb.updatedAt.toLocaleDateString()}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Document Upload & Management Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Documents & Content
            </h2>
            <p className="text-xs text-muted-foreground">
              Files and data sources used to ground responses from {row.bot.name}.
            </p>
          </div>
        </div>

        {/* Upload Dropzone Card */}
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-card/20 p-8 text-center transition-all hover:border-indigo-500/40 hover:bg-card/40">
          <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
            <HugeiconsIcon icon={CloudUploadIcon} size={24} />
          </div>
          <div className="text-sm font-semibold text-foreground">
            Upload documents to this knowledge base
          </div>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Drag and drop your PDF, Markdown, TXT, or DOCX files here, or click to browse.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <Button size="sm" className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white">
              <HugeiconsIcon icon={CloudUploadIcon} size={14} />
              Upload Files
            </Button>
          </div>
        </div>

        {/* Existing documents list */}
        {docs.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Document</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {docs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={File01Icon} size={15} className="text-muted-foreground" />
                        <span>{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground capitalize">
                      {doc.sourceType}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-emerald-400">
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {doc.createdAt.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
