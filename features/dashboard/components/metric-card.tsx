import React from "react";
import { cn } from "cn";

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
        "flex flex-col justify-between rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-xs transition-colors hover:border-border/80",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          {label}
        </span>
        <div className="flex size-9 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
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
              ? "text-emerald-400"
              : "text-muted-foreground",
          )}
        >
          {subtext}
        </p>
      </div>
    </div>
  );
}
