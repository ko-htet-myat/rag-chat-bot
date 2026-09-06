"use client";

import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Loading01Icon,
  RefreshIcon,
  SentIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";

import { BotAvatar } from "./bot-avatar";

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: string;
}

interface BotTestChatTabProps {
  bot: {
    id: string;
    name: string;
    systemPrompt: string;
  };
  initialConversationId?: string | null;
  onConversationCreated?: (conversationId: string) => void;
}

export function BotTestChatTab({
  bot,
  initialConversationId,
  onConversationCreated,
}: BotTestChatTabProps) {
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId || null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Initialize with greeting if empty
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome-message",
          role: "assistant",
          content: `Hi! I'm the ${bot.name}. How can I help you today?`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    }
  }, [bot.name]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userTimestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMessageItem: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: userTimestamp,
    };

    setMessages((prev) => [...prev, userMessageItem]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          botId: bot.id,
          message: trimmed,
          conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      if (data.conversationId && data.conversationId !== conversationId) {
        setConversationId(data.conversationId);
        onConversationCreated?.(data.conversationId);
      }

      const assistantTimestamp = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      setMessages((prev) => [
        ...prev,
        {
          id: data.assistantMessage?.id || `assistant-${Date.now()}`,
          role: "assistant",
          content:
            data.assistantMessage?.content ||
            "I'm here to help! Let me know what questions you have.",
          timestamp: assistantTimestamp,
        },
      ]);
    } catch {
      toast.error("Failed to get response from bot. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setConversationId(null);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content: `Hi! I'm the ${bot.name}. How can I help you today?`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  return (
    <div className="flex h-[560px] flex-col rounded-xl border border-border/70 bg-card/60 shadow-xs overflow-hidden">
      {/* Test Chat Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-5 py-3.5 bg-card/40">
        <div className="flex items-center gap-2.5">
          <BotAvatar size="sm" />
          <span className="text-sm font-semibold text-foreground">
            {bot.name}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            title="Reset Chat"
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            <HugeiconsIcon icon={RefreshIcon} size={12} />
            Reset
          </button>
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </div>
        </div>
      </div>

      {/* Message History */}
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto p-5 space-y-4 scroll-smooth"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div className="flex items-start gap-2.5 max-w-[85%] sm:max-w-[75%]">
              {msg.role === "assistant" && (
                <div className="mt-1">
                  <BotAvatar size="sm" />
                </div>
              )}
              <div>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-tr-sm bg-indigo-600 text-white shadow-xs"
                      : "rounded-tl-sm border border-border/80 bg-secondary/50 text-foreground"
                  }`}
                >
                  {msg.content}
                </div>
                <div
                  className={`mt-1 text-[11px] text-muted-foreground ${
                    msg.role === "user" ? "text-right" : "text-left ml-1"
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="mt-1">
              <BotAvatar size="sm" />
            </div>
            <div className="rounded-2xl rounded-tl-sm border border-border/80 bg-secondary/50 px-4 py-2.5 text-xs text-muted-foreground flex items-center gap-2">
              <HugeiconsIcon
                icon={Loading01Icon}
                size={14}
                className="animate-spin text-indigo-400"
              />
              {bot.name} is thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSendMessage}
        className="shrink-0 border-t border-border/60 p-3.5 bg-card/40 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          className="flex-1 rounded-lg border border-border/70 bg-background/80 px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="flex size-9 items-center justify-center rounded-lg bg-indigo-600 text-white transition-opacity hover:bg-indigo-500 disabled:opacity-40"
        >
          <HugeiconsIcon icon={SentIcon} size={15} />
        </button>
      </form>
    </div>
  );
}
