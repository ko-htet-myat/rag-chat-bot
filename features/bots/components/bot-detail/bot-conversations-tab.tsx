"use client";

import type { ConversationDetailItem } from "@/features/bots/queries/bot-detail.query";

interface BotConversationsTabProps {
  conversations: ConversationDetailItem[];
  onSelectConversation?: (id: string) => void;
  onOpenTestChat: () => void;
}

export function BotConversationsTab({
  conversations,
  onSelectConversation,
  onOpenTestChat,
}: BotConversationsTabProps) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/60 shadow-xs">
      <div className="divide-y divide-border/50">
        {conversations.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-xs text-muted-foreground">
              No conversations have been recorded for this bot yet.
            </p>
            <button
              type="button"
              onClick={onOpenTestChat}
              className="mt-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:underline"
            >
              Start a test chat →
            </button>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelectConversation?.(conv.id)}
              className="flex cursor-pointer items-center justify-between p-4.5 transition-colors hover:bg-white/[0.02]"
            >
              <div>
                <div className="text-sm font-medium text-foreground">
                  {conv.title}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {conv.messageCount} {conv.messageCount === 1 ? "message" : "messages"} · {conv.userDisplay}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {conv.timeDisplay}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
