import type { DashboardData } from "../types";
import { DashboardHeader } from "./dashboard-header";
import { MetricsGrid } from "./metrics-grid";
import { RecentBotsCard } from "./recent-bots-card";
import { RecentConversationsCard } from "./recent-conversations-card";

interface DashboardViewProps {
  data: DashboardData;
}

export function DashboardView({ data }: DashboardViewProps) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Header */}
      <DashboardHeader />

      {/* Metrics Row */}
      <MetricsGrid metrics={data.metrics} />

      {/* Recent Bots & Conversations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentBotsCard bots={data.recentBots} />
        <RecentConversationsCard conversations={data.recentConversations} />
      </div>
    </div>
  );
}
