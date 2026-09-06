import { cn } from "cn";

import { Badge } from "@/components/ui/badge";

export interface BotItem {
  id: string;
  name: string;
  description: string | null;
  model: string;
  status: "active" | "inactive";
  conversations: number;
  updatedAt: string;
}

export function StatusBadge({ status }: { status: BotItem["status"] }) {
  const active = status === "active";
  return (
    <Badge
      variant="ghost"
      className={cn(
        "gap-1.5 rounded-md",
        active ? "text-emerald-500" : "text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          active ? "bg-emerald-500" : "bg-muted-foreground",
        )}
      />
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}

export function ModelChip({ model }: { model: string }) {
  const short = model.split("/").pop() ?? model;
  return (
    <span className="inline-block max-w-50 truncate rounded bg-secondary px-1.5 py-0.5 text-[11px] text-primary">
      {short}
    </span>
  );
}
