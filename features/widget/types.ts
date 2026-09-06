export interface WidgetTheme {
  color?: string;
  displayName?: string;
}

export interface WidgetConfigData {
  id: string;
  botId: string;
  publicKey: string;
  enabled: boolean;
  allowedOrigins: string[];
  displayName: string;
  welcomeMessage: string;
  position: "bottom-right" | "bottom-left";
  themeColor: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BotOption {
  id: string;
  name: string;
}
