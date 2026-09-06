"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Book02Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";

import type { BotKnowledgeBaseItem } from "@/features/bots/queries/bot-detail.query";

interface BotKnowledgeTabProps {
  knowledgeBases: BotKnowledgeBaseItem[];
}

export function BotKnowledgeTab({ knowledgeBases }: BotKnowledgeTabProps) {
  return (
    <div className="space-y-4">
      {/* Top Bar with Manage Knowledge Bases link */}
      <div className="flex justify-end">
        <Link
          href="/knowledge"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-secondary/40 px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          Manage Knowledge Bases
          <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
        </Link>
      </div>

      {/* Knowledge Base Cards */}
      <div className="space-y-3">
        {knowledgeBases.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 bg-card/40 p-8 text-center">
            <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
              <HugeiconsIcon icon={Book02Icon} size={18} />
            </div>
            <div className="mt-3 text-sm font-medium text-foreground">
              No knowledge bases connected
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Connect a knowledge base to empower this bot with custom documentation and FAQs.
            </p>
            <Link
              href="/knowledge"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:underline"
            >
              Add a knowledge base →
            </Link>
          </div>
        ) : (
          knowledgeBases.map((kb) => (
            <div
              key={kb.id}
              className="flex items-center justify-between rounded-xl border border-border/70 bg-card/60 p-4.5 shadow-xs transition-colors hover:border-border"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400">
                  <HugeiconsIcon icon={Book02Icon} size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {kb.name}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {kb.documentCount} {kb.documentCount === 1 ? "document" : "documents"} · {kb.updatedAtDisplay}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                Connected
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
