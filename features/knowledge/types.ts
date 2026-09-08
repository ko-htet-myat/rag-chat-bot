export interface KnowledgeBaseItem {
  id: string;
  name: string;
  description: string | null;
  documentCount: number;
  updatedAt: string;
  botId: string;
  botName: string;
}

export interface UserBotOption {
  id: string;
  name: string;
}

