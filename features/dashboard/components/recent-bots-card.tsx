import Link from "next/link";
import { ArrowRight01Icon, Plus } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { BotAvatar } from "@/features/bots";
import { Button } from "@/components/ui/button";
import type { RecentBotItem } from "../types";

interface RecentBotsCardProps {
  bots: RecentBotItem[];
}

export function RecentBotsCard({ bots }: RecentBotsCardProps) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-xs">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Recent Bots</h2>
        <Link
          href="/bots"
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
        {bots.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              No bots created yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground/80">
              Create your first bot to start chatting.
            </p>
            <div className="mt-4">
              <Button
                size="sm"
                render={<Link href="/bots/create" />}
                nativeButton={false}
              >
                <HugeiconsIcon icon={Plus} size={14} strokeWidth={2} />
                Create Bot
              </Button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {bots.map((bot) => {
              const isActive = bot.status === "active";
              return (
                <div
                  key={bot.id}
                  className="group flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <BotAvatar size="md" className="shrink-0" />
                    <div className="min-w-0">
                      <Link
                        href={`/bots/${bot.id}`}
                        className="block truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary"
                      >
                        {bot.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {bot.conversationsCount}{" "}
                        {bot.conversationsCount === 1
                          ? "conversation"
                          : "conversations"}{" "}
                        • {bot.timeAgo}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 pl-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        isActive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
