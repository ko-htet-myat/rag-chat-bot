import Link from "next/link";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Bot, Plus, Settings, Trash } from "@hugeicons/core-free-icons";

import { BotItem, ModelChip, StatusBadge } from "./bots-list-shared";

export function GridView({
  bots,
  onDelete,
}: {
  bots: BotItem[];
  onDelete: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {bots.map((bot) => (
        <div
          key={bot.id}
          className="group/card flex flex-col rounded-xl bg-card p-5 ring-1 ring-border transition-colors hover:ring-border/60"
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <HugeiconsIcon icon={Bot} size={12} />
              </div>
              <div className="text-sm font-semibold text-foreground">
                {bot.name}
              </div>
            </div>
            <StatusBadge status={bot.status} />
          </div>

          <p className="mb-4 text-[13px] leading-relaxed text-muted-foreground">
            {bot.description ?? "No description"}
          </p>

          <div className="mb-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ModelChip model={bot.model} />
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{bot.conversations.toLocaleString()} conversations</span>
              <span>Updated {bot.updatedAt}</span>
            </div>
          </div>

          <div className="mt-auto flex items-center gap-2 border-t border-border pt-3">
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/bots/${bot.id}`} />}
              nativeButton={false}
              className="flex-1"
            >
              Open
            </Button>
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/bots/${bot.id}/settings`} />}
              nativeButton={false}
            >
              <HugeiconsIcon icon={Settings} size={12} />
              Settings
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete ${bot.name}`}
              onClick={() => onDelete(bot.name)}
            >
              <HugeiconsIcon icon={Trash} size={12} />
            </Button>
          </div>
        </div>
      ))}

      {/* Empty card to create */}
      <Link
        href="/bots/create"
        className="flex min-h-50 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-5 transition-all hover:border-primary/40 hover:bg-primary/5"
      >
        <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
          <HugeiconsIcon icon={Plus} size={12} />
        </div>
        <div className="text-center">
          <div className="text-[13.5px] font-medium text-foreground">
            New Bot
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            Create another chatbot
          </div>
        </div>
      </Link>
    </div>
  );
}