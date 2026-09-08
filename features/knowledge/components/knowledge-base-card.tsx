"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Book02Icon,
  File01Icon,
  Clock01Icon,
  Briefcase01Icon,
} from "@hugeicons/core-free-icons";
import type { KnowledgeBaseItem } from "../types";

interface KnowledgeBaseCardProps {
  knowledgeBase: KnowledgeBaseItem;
  onDelete: (kb: KnowledgeBaseItem) => void;
}

export function KnowledgeBaseCard({
  knowledgeBase,
  onDelete,
}: KnowledgeBaseCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card/60 p-5 shadow-xs transition-colors hover:border-border">
      {/* Top Header: Icon + Title & Description */}
      <div className="flex items-start gap-3.5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
          <HugeiconsIcon icon={Book02Icon} size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground truncate">
            {knowledgeBase.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {knowledgeBase.description || "No description provided."}
          </p>
        </div>
      </div>

      {/* Meta Information */}
      <div className="my-5 space-y-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={File01Icon} size={13} className="shrink-0 text-muted-foreground/80" />
          <span>
            {knowledgeBase.documentCount}{" "}
            {knowledgeBase.documentCount === 1 ? "document" : "documents"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Clock01Icon} size={13} className="shrink-0 text-muted-foreground/80" />
          <span>Updated {knowledgeBase.updatedAt}</span>
        </div>

        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Briefcase01Icon} size={13} className="shrink-0 text-muted-foreground/80" />
          <span className="truncate">{knowledgeBase.botName}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-auto flex items-center gap-2.5 pt-1">
        <Link
          href={`/knowledge/${knowledgeBase.id}`}
          className="flex-1 inline-flex items-center justify-center h-8.5 rounded-lg border border-indigo-500/20 bg-[#191e36] text-xs font-medium text-foreground hover:bg-[#222949] hover:text-white transition-colors"
        >
          Open
        </Link>
        <button
          type="button"
          onClick={() => onDelete(knowledgeBase)}
          className="h-8.5 px-3 rounded-lg text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
