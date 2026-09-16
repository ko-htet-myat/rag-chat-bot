export interface DashboardMetrics {
  totalBots: number;
  botsThisMonth: number;
  totalConversations: number;
  conversationsThisMonth: number;
  conversationsGrowthPercent: number | null;
  knowledgeDocsCount: number;
  knowledgeBasesCount: number;
  isWidgetActive: boolean;
  widgetStatusText: "Active" | "Inactive";
  widgetSubtext: string;
}

export interface RecentBotItem {
  id: string;
  name: string;
  status: "active" | "inactive";
  conversationsCount: number;
  timeAgo: string;
}

export interface RecentConversationItem {
  id: string;
  botId: string;
  botName: string;
  title: string;
  lastMessageSnippet: string;
  timeDisplay: string;
  updatedAt: Date;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  recentBots: RecentBotItem[];
  recentConversations: RecentConversationItem[];
}
