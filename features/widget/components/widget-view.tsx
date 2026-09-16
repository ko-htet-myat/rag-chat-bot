"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { saveWidgetConfigAction } from "../actions";
import type { BotOption, WidgetConfigData } from "../types";
import { WidgetConfigForm } from "./widget-config-form";
import { WidgetLivePreview } from "./widget-live-preview";
import { WidgetDeploymentSection } from "./widget-deployment-section";

interface WidgetViewProps {
  bots: BotOption[];
  initialConfig: WidgetConfigData;
  selectedBotId: string;
}

export function WidgetView({
  bots,
  initialConfig,
  selectedBotId,
}: WidgetViewProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [currentBotId, setCurrentBotId] = useState(selectedBotId);
  const [enabled, setEnabled] = useState(initialConfig.enabled);
  const [displayName, setDisplayName] = useState(initialConfig.displayName);
  const [welcomeMessage, setWelcomeMessage] = useState(
    initialConfig.welcomeMessage,
  );
  const [position, setPosition] = useState<"bottom-right" | "bottom-left">(
    initialConfig.position,
  );
  const [themeColor, setThemeColor] = useState(initialConfig.themeColor);
  const [allowedOrigins, setAllowedOrigins] = useState(
    initialConfig.allowedOrigins,
  );
  const publicKey = initialConfig.publicKey;

  const handleBotChange = (newBotId: string) => {
    setCurrentBotId(newBotId);
    startTransition(() => {
      router.push(`/widget?botId=${newBotId}`);
    });
  };

  const { executeAsync, isExecuting, reset } = useAction(saveWidgetConfigAction, {
    onSuccess: () => {
      toast.success("Widget configuration saved!");
      reset();
      router.refresh();
    },
    onError: ({ error }) => {
      if (error.serverError) {
        toast.error(error.serverError);
      } else if (error.validationErrors) {
        toast.error("Please check the form for errors.");
      } else {
        toast.error("Failed to save configuration.");
      }
    },
    onSettled: () => {
      reset();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic client validation for hex color
    const validHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(
      themeColor.trim(),
    );
    if (!validHex) {
      toast.error("Please enter a valid hex color code (e.g. #6366f1)");
      return;
    }

    await executeAsync({
      botId: currentBotId,
      enabled,
      displayName: displayName.trim() || "Chat Support",
      welcomeMessage:
        welcomeMessage.trim() || "Hi there! How can I help you today? 👋",
      position,
      themeColor: themeColor.trim(),
      allowedOrigins,
    });
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Website Widget
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure how your chatbot appears on your website.
        </p>
      </div>

      {/* Top 2-Column: Configuration & Live Preview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-start">
        <WidgetConfigForm
          bots={bots}
          selectedBotId={currentBotId}
          onBotChange={handleBotChange}
          enabled={enabled}
          onEnabledChange={setEnabled}
          displayName={displayName}
          onDisplayNameChange={setDisplayName}
          welcomeMessage={welcomeMessage}
          onWelcomeMessageChange={setWelcomeMessage}
          position={position}
          onPositionChange={setPosition}
          themeColor={themeColor}
          onThemeColorChange={setThemeColor}
          allowedOrigins={allowedOrigins}
          onAllowedOriginsChange={setAllowedOrigins}
          onSubmit={handleSubmit}
          isExecuting={isExecuting}
        />

        <WidgetLivePreview
          displayName={displayName}
          welcomeMessage={welcomeMessage}
          themeColor={themeColor}
          position={position}
          enabled={enabled}
        />
      </div>

      {/* Deployment Section (Snippet, Status, Public Key) */}
      <div className="pt-2">
        <WidgetDeploymentSection publicKey={publicKey} enabled={enabled} />
      </div>
    </div>
  );
}
