import React from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  subtext: string;
  subtextColor?: "success" | "muted";
  icon: React.ReactNode;
  className?: string;
}

export function MetricCard({
  label,
  value,
  subtext,
  subtextColor = "success",
  icon,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-border/80",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        <div className="flex size-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
          {icon}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-3xl font-bold tracking-tight text-foreground">
          {value}
        </div>
        <p
          className={cn(
            "mt-2 text-xs font-medium",
            subtextColor === "success"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-muted-foreground",
          )}
        >
          {subtext}
        </p>
      </div>
    </div>
  );
}
