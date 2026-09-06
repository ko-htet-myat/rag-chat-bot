import Link from "next/link";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Bot, Trash } from "@hugeicons/core-free-icons";

import { BotItem, ModelChip, StatusBadge } from "./bots-list-shared";

export function ListView({
  bots,
  onDelete,
}: {
  bots: BotItem[];
  onDelete: (bot: BotItem) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Bot
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Model
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Status
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Conversations
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Updated
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {bots.map((bot) => (
            <tr key={bot.id} className="transition-colors hover:bg-muted/40">
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <HugeiconsIcon icon={Bot} size={12} />
                  </div>
                  <div>
                    <div className="text-[13.5px] font-medium text-foreground">
                      {bot.name}
                    </div>
                    <div className="mt-0.5 max-w-70 truncate text-xs text-muted-foreground">
                      {bot.description ?? "No description"}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <ModelChip model={bot.model} />
              </td>
              <td className="px-4 py-3.5">
                <StatusBadge status={bot.status} />
              </td>
              <td className="px-4 py-3.5 text-[13px] text-foreground">
                {bot.conversations.toLocaleString()}
              </td>
              <td className="px-4 py-3.5 text-[13px] text-muted-foreground">
                {bot.updatedAt}
              </td>
              <td className="px-4 py-3.5">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={`/bots/${bot.id}`} />}
                    nativeButton={false}
                  >
                    Open
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${bot.name}`}
                    onClick={() => onDelete(bot)}
                  >
                    <HugeiconsIcon icon={Trash} size={12} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}