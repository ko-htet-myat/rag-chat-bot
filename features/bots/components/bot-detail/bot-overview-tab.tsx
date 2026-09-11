"use client";

import type { BotDetailData } from "@/features/bots/queries/bot-detail.query";

interface BotOverviewTabProps {
  metrics: BotDetailData["metrics"];
  recentConversations: BotDetailData["recentConversations"];
  onSelectConversation?: (id: string) => void;
  onOpenTestChat: () => void;
}

export function BotOverviewTab({
  metrics,
  recentConversations,
  onSelectConversation,
  onOpenTestChat,
}: BotOverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border/70 bg-card/60 p-5 shadow-xs transition-colors hover:border-border">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Total Conversations
          </div>
          <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">
            {metrics.totalConversations}
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card/60 p-5 shadow-xs transition-colors hover:border-border">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Avg. Messages / Conv.
          </div>
          <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">
            {metrics.avgMessagesPerConv}
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card/60 p-5 shadow-xs transition-colors hover:border-border">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Knowledge Docs
          </div>
          <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">
            {metrics.knowledgeDocsCount}
          </div>
        </div>
      </div>

      {/* Recent Conversations Card */}
      <div className="rounded-xl border border-border/70 bg-card/60 p-5 shadow-xs">
        <h2 className="text-sm font-semibold text-foreground">
          Recent Conversations
        </h2>

        <div className="mt-4 divide-y divide-border/50">
          {recentConversations.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs text-muted-foreground">
                No conversations yet.
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
            recentConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => onSelectConversation?.(conv.id)}
                className="flex cursor-pointer items-center justify-between py-3.5 transition-colors hover:bg-white/[0.02] first:pt-1 last:pb-1"
              >
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {conv.title}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {conv.messageCount}{" "}
                    {conv.messageCount === 1 ? "message" : "messages"}
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
    </div>
  );
}
