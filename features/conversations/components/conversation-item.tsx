import Link from "next/link";
import { cn } from "cn";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, RoboticIcon } from "@hugeicons/core-free-icons";
import type { ConversationItem } from "../queries/conversations.query";

// Cycles through accent colours for bot avatars
const BOT_COLORS = [
  "bg-primary/15 text-primary",
  "bg-amber-500/15 text-amber-500",
  "bg-emerald-500/15 text-emerald-500",
  "bg-rose-500/15 text-rose-500",
] as const;

const BOT_NAME_COLORS = [
  "text-primary",
  "text-amber-500",
  "text-emerald-500",
  "text-rose-500",
] as const;

function getBotColorIndex(botId: string): number {
  let hash = 0;
  for (let i = 0; i < botId.length; i++) {
    hash = (hash * 31 + botId.charCodeAt(i)) >>> 0;
  }
  return hash % BOT_COLORS.length;
}

interface ConversationItemProps {
  item: ConversationItem;
}

export function ConversationRow({ item }: ConversationItemProps) {
  const colorIdx = getBotColorIndex(item.botId);

  return (
    <Link
      href={`/conversations/${item.id}`}
      className="flex items-center gap-4 rounded-xl bg-card px-5 py-4 ring-1 ring-border transition-colors hover:bg-muted/40"
    >
      {/* Bot Avatar */}
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          BOT_COLORS[colorIdx],
        )}
      >
        <HugeiconsIcon icon={RoboticIcon} size={12} strokeWidth={2} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "text-[11px] font-semibold uppercase tracking-wide",
            BOT_NAME_COLORS[colorIdx],
          )}
        >
          {item.botName}
        </div>
        <div className="mt-0.5 truncate text-[13.5px] font-medium text-foreground">
          {item.title}
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {item.messageCount} {item.messageCount === 1 ? "message" : "messages"}
        </div>
      </div>

      {/* Time + chevron */}
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-xs text-muted-foreground">{item.timeDisplay}</span>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          size={12}
          className="text-muted-foreground"
        />
      </div>
    </Link>
  );
}
