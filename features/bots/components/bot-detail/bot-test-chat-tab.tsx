"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
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
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(
    Boolean(initialConversationId),
  );

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollRafRef = useRef<number | null>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRafRef.current) {
      cancelAnimationFrame(scrollRafRef.current);
    }
    scrollRafRef.current = requestAnimationFrame(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    });
  }, []);

  // Fetch messages when initialConversationId changes
  useEffect(() => {
    if (!initialConversationId) return;

    let isMounted = true;

    fetch(`/api/chat/messages/${initialConversationId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load conversation");
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (
          data.messages &&
          Array.isArray(data.messages) &&
          data.messages.length > 0
        ) {
          setMessages(
            data.messages.map(
              (m: {
                id: string;
                role: string;
                content: string;
                createdAt: string;
              }) => ({
                id: m.id,
                role: m.role as "assistant" | "user",
                content: m.content,
                timestamp: new Date(m.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              }),
            ),
          );
        }
      })
      .catch(() => {
        if (isMounted) {
          toast.error("Failed to load conversation history");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingHistory(false);
      });

    return () => {
      isMounted = false;
    };
  }, [initialConversationId]);

  // Scroll to bottom on new messages or loading state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isStreaming, scrollToBottom]);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (scrollRafRef.current) {
        cancelAnimationFrame(scrollRafRef.current);
      }
    };
  }, []);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setIsStreaming(false);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading || isStreaming) return;

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

    const controller = new AbortController();
    abortControllerRef.current = controller;

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
        signal: controller.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || "Failed to get response");
      }

      const nextConversationId = response.headers.get("X-Conversation-Id");
      if (nextConversationId && nextConversationId !== conversationId) {
        setConversationId(nextConversationId);
        onConversationCreated?.(nextConversationId);
      }

      if (!response.body) {
        throw new Error("No response body stream received");
      }

      const assistantMessageId = `assistant-${Date.now()}`;
      const assistantTimestamp = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Switch from loading to active streaming
      setIsLoading(false);
      setIsStreaming(true);

      // Append blank assistant bubble ready for progressive text streaming
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          timestamp: assistantTimestamp,
        },
      ]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulatedText += decoder.decode(value, { stream: true });

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: accumulatedText }
              : msg,
          ),
        );
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // User voluntarily aborted — keep partial response
        return;
      }
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to get response from bot. Please try again.",
      );
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleReset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setIsStreaming(false);
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
            className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 cursor-pointer"
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
        {isLoadingHistory ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <HugeiconsIcon
                icon={Loading01Icon}
                size={14}
                className="animate-spin text-indigo-400"
              />
              Loading conversation history...
            </div>
          </div>
        ) : (
          messages.map((msg) => (
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
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "rounded-tr-sm bg-indigo-600 text-white shadow-xs"
                        : "rounded-tl-sm border border-border/80 bg-secondary/50 text-foreground"
                    }`}
                  >
                    {msg.content || (
                      <span className="inline-block size-2 animate-pulse rounded-full bg-muted-foreground" />
                    )}
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
          ))
        )}

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
          placeholder={
            isStreaming ? "Generating response..." : "Type your message..."
          }
          disabled={isLoading || isStreaming}
          className="flex-1 rounded-lg border border-border/70 bg-background/80 px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none disabled:opacity-60"
        />

        {isLoading || isStreaming ? (
          <button
            type="button"
            onClick={handleStop}
            title="Stop generation"
            className="flex size-9 items-center justify-center rounded-lg bg-rose-600/90 text-white transition-opacity hover:bg-rose-600 cursor-pointer"
          >
            <div className="size-2.5 rounded-xs bg-white" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="flex size-9 items-center justify-center rounded-lg bg-indigo-600 text-white transition-opacity hover:bg-indigo-500 disabled:opacity-40 cursor-pointer"
          >
            <HugeiconsIcon icon={SentIcon} size={15} />
          </button>
        )}
      </form>
    </div>
  );
}
