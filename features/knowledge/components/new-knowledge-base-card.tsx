"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Plus } from "@hugeicons/core-free-icons";

export function NewKnowledgeBaseCard() {
  return (
    <Link
      href="/knowledge/create"
      className="group flex min-h-[200px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-card/20 p-6 text-center transition-all hover:border-primary/50 hover:bg-card/40"
    >
      <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-secondary/80 text-muted-foreground transition-colors group-hover:bg-primary/20 group-hover:text-primary">
        <HugeiconsIcon icon={Plus} size={16} />
      </div>
      <div className="text-[14px] font-medium text-foreground">
        New Knowledge Base
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        Upload and organize documents
      </div>
    </Link>
  );
}
