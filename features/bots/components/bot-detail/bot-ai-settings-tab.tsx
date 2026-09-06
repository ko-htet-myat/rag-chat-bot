"use client";

import type { BotDetailData } from "@/features/bots/queries/bot-detail.query";

interface BotAiSettingsTabProps {
  bot: BotDetailData["bot"];
}

export function BotAiSettingsTab({ bot }: BotAiSettingsTabProps) {
  const providerDisplay =
    bot.modelProvider === "openrouter" ? "OpenRouter" : bot.modelProvider;

  const fullModelString = bot.model.startsWith("openrouter/")
    ? bot.model
    : `openrouter/${bot.model}`;

  return (
    <div className="space-y-6">
      {/* Model Section Card */}
      <div className="rounded-xl border border-border/70 bg-card/60 p-6 shadow-xs">
        <h2 className="text-sm font-semibold text-foreground">Model</h2>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Provider
            </label>
            <div className="mt-1.5 flex h-10 w-full items-center rounded-lg border border-border/70 bg-background/60 px-3.5 text-xs md:text-sm text-foreground">
              {providerDisplay}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Current Model
            </label>
            <div className="mt-1.5 flex h-10 w-full items-center rounded-lg border border-border/70 bg-background/60 px-3.5 font-mono text-xs md:text-sm text-indigo-400">
              {fullModelString}
            </div>
          </div>
        </div>
      </div>

      {/* Behavior Section Card */}
      <div className="rounded-xl border border-border/70 bg-card/60 p-6 shadow-xs">
        <h2 className="text-sm font-semibold text-foreground">Behavior</h2>

        <div className="mt-5">
          <label className="text-xs font-medium text-muted-foreground">
            System Prompt
          </label>
          <div className="mt-1.5 min-h-36 w-full rounded-lg border border-border/70 bg-background/60 p-3.5 font-mono text-xs md:text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {bot.systemPrompt}
          </div>
        </div>
      </div>
    </div>
  );
}
