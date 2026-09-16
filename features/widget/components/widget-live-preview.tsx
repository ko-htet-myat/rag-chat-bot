"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FullScreenIcon,
  MinimizeScreenIcon,
  SentIcon,
} from "@hugeicons/core-free-icons";
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-foreground">Live Preview</h2>
          {isFullscreen && (
            <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary border border-primary/20">
              Full Screen Mode
            </span>
          )}
        </div>
        {!enabled && (
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            (Widget is disabled)
          </span>
        )}
      </div>

      {/* Mock website screen */}
      <div className="relative flex flex-1 min-h-[460px] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40 dark:bg-[#0d101d] p-6 shadow-inner">
        {/* Mock background pattern / website placeholder */}
        <div className="pointer-events-none select-none text-center">
          <span className="text-sm font-normal text-muted-foreground/60">
            Your website content
          </span>
        </div>

        {/* Floating / Fullscreen Chat Widget */}
        <div
          className={cn(
            "absolute transition-all duration-300 border border-border bg-card dark:border-white/10 dark:bg-[#161828] shadow-2xl overflow-hidden flex flex-col",
            isFullscreen
              ? "inset-3 sm:inset-4 rounded-xl z-10"
              : cn(
                  "bottom-5 w-[270px] sm:w-[290px] rounded-2xl",
                  position === "bottom-right" ? "right-5" : "left-5",
                ),
            !enabled && "opacity-60 grayscale-[40%]",
          )}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-3.5 py-3 transition-colors shrink-0"
            style={{ backgroundColor: themeColor }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <BotAvatar size="sm" />
              <span className="truncate text-xs sm:text-sm font-semibold text-white drop-shadow-xs">
                {displayName.trim() || "Chat Support"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? "Exit full screen" : "Full screen"}
                aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
                className="inline-flex size-6 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/20 hover:text-white cursor-pointer"
              >
                <HugeiconsIcon
                  icon={isFullscreen ? MinimizeScreenIcon : FullScreenIcon}
                  size={13}
                />
              </button>
              <span className="size-2 rounded-full bg-white shadow-xs ml-0.5" />
            </div>
          </div>

          {/* Chat Body */}
          <div
            className={cn(
              "flex flex-col justify-end gap-3 bg-muted/30 dark:bg-[#111322] p-4",
              isFullscreen ? "flex-1 overflow-y-auto" : "min-h-[140px]",
            )}
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 shrink-0">
                <BotAvatar size="sm" />
              </div>
              <div className="rounded-2xl rounded-tl-xs border border-border bg-card dark:border-white/5 dark:bg-[#1e2238] px-3.5 py-2.5 text-xs leading-relaxed text-foreground dark:text-slate-200 shadow-xs max-w-[85%] break-words">
                {welcomeMessage.trim() || "Hi there! How can I help you today? 👋"}
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="flex flex-col border-t border-border bg-card dark:border-white/5 dark:bg-[#161828] p-2.5 pb-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                placeholder="Type a message..."
                className="flex-1 rounded-lg border border-input bg-background dark:border-white/10 dark:bg-[#0d0f1b] px-3 py-1.5 text-xs text-foreground dark:text-slate-300 placeholder:text-muted-foreground outline-hidden pointer-events-none"
              />
              <button
                type="button"
                tabIndex={-1}
                className="flex size-7 items-center justify-center rounded-lg text-white shadow-xs shrink-0 transition-colors"
                style={{ backgroundColor: themeColor }}
              >
                <HugeiconsIcon icon={SentIcon} size={13} />
              </button>
            </div>
            <div className="mt-1.5 text-center text-[11px] text-muted-foreground select-none">
              Powered by <span className="text-primary font-medium">Inno Chat</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
