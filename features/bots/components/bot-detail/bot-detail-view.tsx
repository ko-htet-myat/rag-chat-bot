"use client";

import { useState } from "react";
import { cn } from "cn";

import type { BotDetailData } from "@/features/bots/queries/bot-detail.query";
import { BotDetailHeader } from "./bot-detail-header";
import { BotOverviewTab } from "./bot-overview-tab";
import { BotAiSettingsTab } from "./bot-ai-settings-tab";
import { BotKnowledgeTab } from "./bot-knowledge-tab";
import { BotConversationsTab } from "./bot-conversations-tab";
import { BotTestChatTab } from "./bot-test-chat-tab";

type TabKey =
  | "overview"
  | "ai-settings"
  | "knowledge"
  | "conversations"
  | "test-chat";

interface BotDetailViewProps {
  data: BotDetailData;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "ai-settings", label: "AI Settings" },
  { key: "knowledge", label: "Knowledge" },
  { key: "conversations", label: "Conversations" },
  { key: "test-chat", label: "Test Chat" },
];

export function BotDetailView({ data }: BotDetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setActiveTab("test-chat");
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-2 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <BotDetailHeader
        bot={data.bot}
        onOpenTestChat={() => setActiveTab("test-chat")}
      />

      {/* Tabs Navigation */}
      <div className="border-b border-border/60">
        <nav className="flex space-x-6 overflow-x-auto scrollbar-none" aria-label="Tabs">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "relative py-3 text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-indigo-500" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === "overview" && (
          <BotOverviewTab
            metrics={data.metrics}
            recentConversations={data.recentConversations}
            onSelectConversation={handleSelectConversation}
            onOpenTestChat={() => setActiveTab("test-chat")}
          />
        )}

        {activeTab === "ai-settings" && <BotAiSettingsTab bot={data.bot} />}

        {activeTab === "knowledge" && (
          <BotKnowledgeTab knowledgeBases={data.knowledgeBases} />
        )}

        {activeTab === "conversations" && (
          <BotConversationsTab
            conversations={data.allConversations}
            onSelectConversation={handleSelectConversation}
            onOpenTestChat={() => setActiveTab("test-chat")}
          />
        )}

        {activeTab === "test-chat" && (
          <BotTestChatTab
            bot={data.bot}
            initialConversationId={selectedConversationId}
          />
        )}
      </div>
    </div>
  );
}
