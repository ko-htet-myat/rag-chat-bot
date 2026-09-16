import {
  AppWindowIcon,
  Book02Icon,
  Message01Icon,
  RoboticIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { DashboardMetrics } from "../types";
import { MetricCard } from "./metric-card";

interface MetricsGridProps {
  metrics: DashboardMetrics;
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  const conversationSubtext =
    metrics.conversationsGrowthPercent !== null
      ? `+${metrics.conversationsGrowthPercent}% this month`
      : `+${metrics.conversationsThisMonth} this month`;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Bots */}
      <MetricCard
        label="TOTAL BOTS"
        value={metrics.totalBots.toLocaleString()}
        subtext={`+${metrics.botsThisMonth} this month`}
        subtextColor="success"
        icon={<HugeiconsIcon icon={RoboticIcon} size={18} strokeWidth={2} />}
      />

      {/* 2. Conversations */}
      <MetricCard
        label="CONVERSATIONS"
        value={metrics.totalConversations.toLocaleString()}
        subtext={conversationSubtext}
        subtextColor="success"
        icon={<HugeiconsIcon icon={Message01Icon} size={18} strokeWidth={2} />}
      />

      {/* 3. Knowledge Docs */}
      <MetricCard
        label="KNOWLEDGE DOCS"
        value={metrics.knowledgeDocsCount.toLocaleString()}
        subtext={`Across ${metrics.knowledgeBasesCount} base${
          metrics.knowledgeBasesCount === 1 ? "" : "s"
        }`}
        subtextColor="muted"
        icon={<HugeiconsIcon icon={Book02Icon} size={18} strokeWidth={2} />}
      />

      {/* 4. Widget Status */}
      <MetricCard
        label="WIDGET STATUS"
        value={
          <div className="flex items-center gap-2.5">
            <span
              className={`size-2.5 rounded-full ${
                metrics.isWidgetActive
                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                  : "bg-muted-foreground/40"
              }`}
            />
            <span>{metrics.activeWidgetsCount}</span>
          </div>
        }
        subtext={metrics.widgetSubtext}
        subtextColor={metrics.isWidgetActive ? "success" : "muted"}
        icon={<HugeiconsIcon icon={AppWindowIcon} size={18} strokeWidth={2} />}
      />
    </div>
  );
}
