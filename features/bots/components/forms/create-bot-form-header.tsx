"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Bot, Loading01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";

import { CancelBotButton } from "./cancel-bot-button";

interface CreateBotFormHeaderProps {
  isExecuting: boolean;
  onSubmit?: () => void;
}

export function CreateBotFormHeader({ isExecuting, onSubmit }: CreateBotFormHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-2">
      <Link
        href="/bots"
        className="inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
        Back to Bots
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Create New Bot
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure your AI chatbot&apos;s identity, system behavior, and LLM
            settings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CancelBotButton disabled={isExecuting} />
          <Button type="button" disabled={isExecuting} onClick={onSubmit}>
            {isExecuting ? (
              <>
                <HugeiconsIcon
                  icon={Loading01Icon}
                  size={14}
                  className="animate-spin"
                />
                Creating...
              </>
            ) : (
              <>
                <HugeiconsIcon icon={Bot} size={14} />
                Create Bot
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}