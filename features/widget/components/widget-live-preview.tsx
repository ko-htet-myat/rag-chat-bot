"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SentIcon } from "@hugeicons/core-free-icons";
import { BotAvatar } from "@/features/bots/components/bot-detail/bot-avatar";
import { cn } from "@/lib/utils";

interface WidgetLivePreviewProps {
  displayName: string;
  welcomeMessage: string;
  themeColor: string;
  position: "bottom-right" | "bottom-left";
  enabled: boolean;
}

export function WidgetLivePreview({
  displayName,
  welcomeMessage,
  themeColor,
  position,
  enabled,
}: WidgetLivePreviewProps) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-border/70 bg-card/60 p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between pb-4">
        <h2 className="text-base font-semibold text-foreground">Live Preview</h2>
        {!enabled && (
          <span className="text-xs text-amber-400/90 font-medium">
            (Widget is disabled)
          </span>
        )}
      </div>

      {/* Mock website screen */}
      <div className="relative flex flex-1 min-h-[460px] w-full items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-[#0d101d] p-6 shadow-inner">
        {/* Mock background pattern / website placeholder */}
        <div className="pointer-events-none select-none text-center">
          <span className="text-sm font-normal text-slate-500/70">
            Your website content
          </span>
        </div>

        {/* Floating Chat Widget */}
        <div
          className={cn(
            "absolute bottom-5 transition-all duration-300 w-[270px] sm:w-[290px] rounded-2xl border border-white/10 bg-[#161828] shadow-2xl overflow-hidden flex flex-col",
            position === "bottom-right" ? "right-5" : "left-5",
            !enabled && "opacity-60 grayscale-[40%]",
          )}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-3.5 py-3 transition-colors"
            style={{ backgroundColor: themeColor }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <BotAvatar size="sm" />
              <span className="truncate text-xs sm:text-sm font-semibold text-white drop-shadow-xs">
                {displayName.trim() || "Chat Support"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="size-2 rounded-full bg-white shadow-xs" />
            </div>
          </div>

          {/* Chat Body */}
          <div className="flex flex-col justify-end gap-3 bg-[#111322] p-4 min-h-[140px]">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 shrink-0">
                <BotAvatar size="sm" />
              </div>
              <div className="rounded-2xl rounded-tl-xs border border-white/5 bg-[#1e2238] px-3.5 py-2.5 text-xs leading-relaxed text-slate-200 shadow-xs max-w-[85%] break-words">
                {welcomeMessage.trim() || "Hi there! How can I help you today? 👋"}
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="flex items-center gap-2 border-t border-white/5 bg-[#161828] p-2.5">
            <input
              type="text"
              readOnly
              placeholder="Type a message..."
              className="flex-1 rounded-lg border border-white/10 bg-[#0d0f1b] px-3 py-1.5 text-xs text-slate-300 placeholder:text-slate-500 outline-hidden pointer-events-none"
            />
            <button
              type="button"
              tabIndex={-1}
              className="flex size-7 items-center justify-center rounded-lg text-white shadow-sm shrink-0 transition-colors"
              style={{ backgroundColor: themeColor }}
            >
              <HugeiconsIcon icon={SentIcon} size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
