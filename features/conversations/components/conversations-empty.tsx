import { HugeiconsIcon } from "@hugeicons/react";
import { Message } from "@hugeicons/core-free-icons";

export function ConversationsEmpty() {
  return (
    <div className="flex min-h-75 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-8 text-center">
      <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
        <HugeiconsIcon icon={Message} size={12} />
      </div>
      <div>
        <div className="text-sm font-medium text-foreground">
          No conversations yet
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          Conversations will appear here once users start chatting with your
          bots.
        </div>
      </div>
    </div>
  );
}
