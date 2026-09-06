import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { cn } from "cn";

import { Badge } from "@/components/ui/badge";

import type { ModelOption } from "../../constants";

interface ModelCardProps {
  model: ModelOption;
  isSelected: boolean;
  onSelect: () => void;
}

export function ModelCard({ model, isSelected, onSelect }: ModelCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex flex-col rounded-xl border p-4 text-left transition-all",
        isSelected
          ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary"
          : "border-border bg-card hover:border-border/80 hover:bg-muted/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground">
            {model.provider}
          </span>
          <div className="text-sm font-semibold text-foreground">
            {model.name}
          </div>
        </div>
        {isSelected ? (
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            size={16}
            className="text-primary"
          />
        ) : model.badge ? (
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
            {model.badge}
          </Badge>
        ) : null}
      </div>
      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
        {model.description}
      </p>
      <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
        <span className="">{model.contextWindow} context</span>
        <span className=" text-[10px] opacity-70">
          {model.id.split("/")[1] ?? model.id}
        </span>
      </div>
    </button>
  );
}
