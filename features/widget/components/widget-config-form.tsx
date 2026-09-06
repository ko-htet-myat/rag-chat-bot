"use client";

import React, { useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick01Icon } from "@hugeicons/core-free-icons";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import type { BotOption } from "../types";
import { cn } from "@/lib/utils";

interface WidgetConfigFormProps {
  bots: BotOption[];
  selectedBotId: string;
  onBotChange: (botId: string) => void;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  displayName: string;
  onDisplayNameChange: (name: string) => void;
  welcomeMessage: string;
  onWelcomeMessageChange: (msg: string) => void;
  position: "bottom-right" | "bottom-left";
  onPositionChange: (pos: "bottom-right" | "bottom-left") => void;
  themeColor: string;
  onThemeColorChange: (color: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isExecuting: boolean;
}

export function WidgetConfigForm({
  bots,
  selectedBotId,
  onBotChange,
  enabled,
  onEnabledChange,
  displayName,
  onDisplayNameChange,
  welcomeMessage,
  onWelcomeMessageChange,
  position,
  onPositionChange,
  themeColor,
  onThemeColorChange,
  onSubmit,
  isExecuting,
}: WidgetConfigFormProps) {
  const colorInputRef = useRef<HTMLInputElement>(null);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith("#")) {
      val = `#${val}`;
    }
    onThemeColorChange(val);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col rounded-xl border border-border/70 bg-card/60 p-5 sm:p-6 shadow-xs space-y-6"
    >
      <h2 className="text-base font-semibold text-foreground">Configuration</h2>

      {/* 1. Widget Enabled Toggle */}
      <div className="flex items-center justify-between pb-2">
        <div className="space-y-0.5">
          <label
            htmlFor="widget-enabled"
            className="text-sm font-medium text-foreground cursor-pointer"
          >
            Widget Enabled
          </label>
          <p className="text-xs text-muted-foreground">
            Show the chat widget on your website
          </p>
        </div>
        <Switch
          id="widget-enabled"
          checked={enabled}
          onCheckedChange={(checked) => onEnabledChange(Boolean(checked))}
        />
      </div>

      {/* 2. Connected Bot */}
      <div className="space-y-2">
        <label
          htmlFor="connected-bot"
          className="text-xs font-medium text-muted-foreground"
        >
          Connected Bot
        </label>
        <NativeSelect
          id="connected-bot"
          value={selectedBotId}
          onChange={(e) => onBotChange(e.target.value)}
          disabled={isExecuting || bots.length === 0}
          className="w-full bg-[#0e101a] border-border/70 text-sm"
        >
          {bots.map((bot) => (
            <option key={bot.id} value={bot.id} className="bg-[#161828] text-foreground">
              {bot.name}
            </option>
          ))}
        </NativeSelect>
      </div>

      {/* 3. Widget Display Name */}
      <div className="space-y-2">
        <label
          htmlFor="display-name"
          className="text-xs font-medium text-muted-foreground"
        >
          Widget Display Name
        </label>
        <Input
          id="display-name"
          value={displayName}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          placeholder="Acme Support"
          disabled={isExecuting}
          className="bg-[#0e101a] border-border/70 text-sm"
        />
      </div>

      {/* 4. Welcome Message */}
      <div className="space-y-2">
        <label
          htmlFor="welcome-message"
          className="text-xs font-medium text-muted-foreground"
        >
          Welcome Message
        </label>
        <Input
          id="welcome-message"
          value={welcomeMessage}
          onChange={(e) => onWelcomeMessageChange(e.target.value)}
          placeholder="Hi there! How can I help you today? 👋"
          disabled={isExecuting}
          className="bg-[#0e101a] border-border/70 text-sm"
        />
      </div>

      {/* 5. Position */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Position</label>
        <div className="grid grid-cols-2 gap-3">
          {/* Bottom Right */}
          <button
            type="button"
            onClick={() => onPositionChange("bottom-right")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg border py-2.5 px-4 text-xs sm:text-sm font-medium transition-all",
              position === "bottom-right"
                ? "border-indigo-500 bg-indigo-500/10 text-white ring-1 ring-indigo-500/30"
                : "border-border/70 bg-[#0e101a] text-muted-foreground hover:bg-[#141624] hover:text-foreground",
            )}
          >
            {position === "bottom-right" && (
              <HugeiconsIcon icon={Tick01Icon} size={14} className="text-indigo-400" />
            )}
            Bottom Right
          </button>

          {/* Bottom Left */}
          <button
            type="button"
            onClick={() => onPositionChange("bottom-left")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg border py-2.5 px-4 text-xs sm:text-sm font-medium transition-all",
              position === "bottom-left"
                ? "border-indigo-500 bg-indigo-500/10 text-white ring-1 ring-indigo-500/30"
                : "border-border/70 bg-[#0e101a] text-muted-foreground hover:bg-[#141624] hover:text-foreground",
            )}
          >
            {position === "bottom-left" && (
              <HugeiconsIcon icon={Tick01Icon} size={14} className="text-indigo-400" />
            )}
            Bottom Left
          </button>
        </div>
      </div>

      {/* 6. Theme Color */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Theme Color</label>
        <div className="flex items-center gap-3">
          {/* Color swatch clicker */}
          <div
            onClick={() => colorInputRef.current?.click()}
            title="Choose theme color"
            className="size-10 shrink-0 cursor-pointer rounded-lg border border-white/10 shadow-sm transition-transform hover:scale-105"
            style={{ backgroundColor: themeColor }}
          >
            <input
              ref={colorInputRef}
              type="color"
              value={themeColor.length === 7 ? themeColor : "#6366f1"}
              onChange={(e) => onThemeColorChange(e.target.value)}
              className="sr-only"
            />
          </div>

          {/* Hex Input */}
          <Input
            value={themeColor}
            onChange={handleHexChange}
            placeholder="#6366f1"
            disabled={isExecuting}
            className="font-mono bg-[#0e101a] border-border/70 text-sm tracking-wide"
          />
        </div>
      </div>

      {/* 7. Save Configuration button */}
      <div className="pt-2">
        <Button
          type="submit"
          disabled={isExecuting}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm w-auto"
        >
          {isExecuting ? "Saving..." : "Save Configuration"}
        </Button>
      </div>
    </form>
  );
}
