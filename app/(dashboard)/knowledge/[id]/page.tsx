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
} from "@hugeicons/core-free-icons";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { bots, documents, knowledgeBases } from "@/db/schema";

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
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <Link
          href="/knowledge"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
          Back to Knowledge Bases
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
            <HugeiconsIcon icon={Book02Icon} size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {row.kb.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {row.kb.description || "No description"}
            </p>
          </div>
        </div>

        <Link
          href={`/bots/${row.bot.id}`}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <HugeiconsIcon icon={Briefcase01Icon} size={14} />
          {row.bot.name}
        </Link>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-base font-semibold text-foreground">
          Documents ({docs.length})
        </h2>

        {docs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-8 text-center">
            <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
              <HugeiconsIcon icon={File01Icon} size={18} />
            </div>
            <div className="mt-3 text-sm font-medium text-foreground">
              No documents in this knowledge base
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Upload files or add URLs to train your AI assistant.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 text-sm"
              >
                <div className="flex items-center gap-3">
                  <HugeiconsIcon
                    icon={File01Icon}
                    size={16}
                    className="text-muted-foreground"
                  />
                  <span className="font-medium text-foreground">{doc.name}</span>
                </div>
                <span className="text-xs text-muted-foreground capitalize">
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
