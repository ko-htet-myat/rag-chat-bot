"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Message01Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { BotAvatar } from "./bot-avatar";

interface BotDetailHeaderProps {
  bot: {
    id: string;
    name: string;
    description: string | null;
    status: "active" | "inactive";
  };
  onOpenTestChat: () => void;
}

export function BotDetailHeader({
  bot,
  onOpenTestChat,
}: BotDetailHeaderProps) {
  const isActive = bot.status === "active";

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link
          href="/bots"
          className="transition-colors hover:text-foreground hover:underline"
        >
          My Bots
        </Link>
        <HugeiconsIcon icon={ArrowRight01Icon} size={10} className="opacity-50" />
        <span className="font-medium text-foreground truncate max-w-75">
          {bot.name}
        </span>
      </nav>

      {/* Main Bot Info */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <BotAvatar size="lg" />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                {bot.name}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-muted text-muted-foreground border border-border"
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${
                    isActive ? "bg-emerald-400" : "bg-muted-foreground"
                  }`}
                />
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {bot.description || "No description provided for this bot."}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            render={<Link href={`/bots/${bot.id}/edit`} />}
            nativeButton={false}
            className="border-border/80 bg-card/60 hover:bg-card hover:text-foreground text-xs md:text-sm h-9 px-4"
          >
            Edit Bot
          </Button>

          <Button
            onClick={onOpenTestChat}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs md:text-sm h-9 px-4 gap-2 shadow-sm"
          >
            <HugeiconsIcon icon={Message01Icon} size={14} />
            Test Chat
          </Button>
        </div>
      </div>
    </div>
  );
}
