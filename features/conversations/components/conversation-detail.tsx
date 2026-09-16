import Link from "next/link";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  RoboticIcon,
  UserIcon,
  ComputerIcon,
} from "@hugeicons/core-free-icons";
import type { ConversationDetailData } from "../queries/conversation-detail.query";

interface ConversationDetailProps {
  data: ConversationDetailData;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

interface MessageBubbleProps {
  role: "system" | "user" | "assistant";
  content: string;
  timeDisplay: string;
  model: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
}

function MessageBubble({
  role,
  content,
  timeDisplay,
  model,
  inputTokens,
  outputTokens,
}: MessageBubbleProps) {
  const isUser = role === "user";
  const isSystem = role === "system";

  if (isSystem) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <HugeiconsIcon
          icon={ComputerIcon}
          size={12}
          className="mt-0.5 shrink-0"
        />
        <span className="font-mono leading-relaxed">{content}</span>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {/* Avatar — assistant only */}
      {!isUser && (
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary mt-0.5">
          <HugeiconsIcon icon={RoboticIcon} size={12} strokeWidth={2} />
        </div>
      )}

      <div
        className={cn("flex max-w-[75%] flex-col gap-1", isUser && "items-end")}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "rounded-tr-sm bg-primary text-primary-foreground"
              : "rounded-tl-sm bg-card ring-1 ring-border text-foreground",
          )}
        >
          <p className="whitespace-pre-wrap">{content}</p>
        </div>

        {/* Metadata row */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>{timeDisplay}</span>
          {!isUser && model && (
            <>
              <span>·</span>
              <span className="font-mono">{model.split("/").pop()}</span>
            </>
          )}
          {!isUser && (inputTokens || outputTokens) ? (
            <>
              <span>·</span>
              <span>
                {inputTokens ?? 0}↑ {outputTokens ?? 0}↓ tokens
              </span>
            </>
          ) : null}
        </div>
      </div>

      {/* Avatar — user only */}
      {isUser && (
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground mt-0.5">
          <HugeiconsIcon icon={UserIcon} size={12} strokeWidth={2} />
        </div>
      )}
    </div>
  );
}

export function ConversationDetail({ data }: ConversationDetailProps) {
  const { conversation, bot, messages, stats } = data;

  // Visible messages: skip system-role messages from the main thread display
  const visibleMessages = messages.filter((m) => m.role !== "system");

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Back link */}
      <div>
        <Link
          href="/conversations"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
          All Conversations
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {conversation.title}
          </h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-primary">{bot.name}</span>
            <span>·</span>
            <span>
              {conversation.createdAt.toLocaleDateString([], {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Messages" value={stats.totalMessages} />
        <StatCard label="User Messages" value={stats.userMessages} />
        <StatCard label="Bot Replies" value={stats.assistantMessages} />
        <StatCard
          label="Tokens Used"
          value={(
            stats.totalInputTokens + stats.totalOutputTokens
          ).toLocaleString()}
        />
      </div>

      {/* Message thread */}
      <div className="rounded-xl border border-border bg-card shadow-xs">
        <div className="border-b border-border px-5 py-3">
          <p className="text-xs font-medium text-muted-foreground">
            {visibleMessages.length} messages
          </p>
        </div>
        <div className="flex flex-col gap-5 p-5">
          {visibleMessages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No messages in this conversation.
            </p>
          ) : (
            visibleMessages.map((msg) => (
              <MessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                timeDisplay={msg.timeDisplay}
                model={msg.model}
                inputTokens={msg.inputTokens}
                outputTokens={msg.outputTokens}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
