import Link from "next/link";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { RecentConversationItem } from "../types";

interface RecentConversationsCardProps {
  conversations: RecentConversationItem[];
}

export function RecentConversationsCard({
  conversations,
}: RecentConversationsCardProps) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-xs">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          Recent Conversations
        </h2>
        <Link
          href="/conversations"
          className="group inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <span>View all</span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={14}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </div>

      <div className="mt-5 flex-1">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              No conversations yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground/80">
              Conversations from the website widget will show up here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {conversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/conversations/${conv.id}`}
                className="group block py-3.5 first:pt-0 last:pb-0 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-semibold text-primary transition-colors group-hover:text-primary/80">
                    {conv.botName}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {conv.timeDisplay}
                  </span>
                </div>
                <p className="mt-1 line-clamp-1 text-sm font-medium text-foreground transition-colors group-hover:text-foreground/80">
                  {conv.lastMessageSnippet}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
