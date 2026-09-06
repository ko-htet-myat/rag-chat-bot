"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Bot, Loading01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";

import { CancelBotButton } from "./cancel-bot-button";

interface CreateBotFormFooterProps {
  isExecuting: boolean;
}

export function CreateBotFormFooter({ isExecuting }: CreateBotFormFooterProps) {
  return (
    <div className="flex items-center justify-end gap-3 pb-8">
      <CancelBotButton disabled={isExecuting} />
      <Button type="submit" disabled={isExecuting}>
        {isExecuting ? (
          <>
            <HugeiconsIcon
              icon={Loading01Icon}
              size={14}
              className="animate-spin"
            />
            Creating Bot...
          </>
        ) : (
          <>
            <HugeiconsIcon icon={Bot} size={14} />
            Create Bot
          </>
        )}
      </Button>
    </div>
  );
}