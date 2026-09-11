"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";

import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

import type {
  ConversationItem,
  ConversationsData,
} from "../queries/conversations.query";
import { ConversationRow } from "./conversation-item";
import { ConversationsEmpty } from "./conversations-empty";

// ─── Schema ───────────────────────────────────────────────────────────────────

const filterSchema = z.object({
  search: z.string(),
  botId: z.string(),
});

type FilterValues = z.infer<typeof filterSchema>;

// ─── Constants ────────────────────────────────────────────────────────────────

const GROUP_ORDER: ConversationItem["group"][] = [
  "TODAY",
  "YESTERDAY",
  "EARLIER",
];

const GROUP_LABELS: Record<ConversationItem["group"], string> = {
  TODAY: "Today",
  YESTERDAY: "Yesterday",
  EARLIER: "Earlier",
};

// ─── Component ────────────────────────────────────────────────────────────────

interface ConversationsListProps {
  data: ConversationsData;
}

export function ConversationsList({ data }: ConversationsListProps) {
  const { register, watch } = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: { search: "", botId: "all" },
  });

  const search = watch("search");
  const botId = watch("botId");

  const filtered = useMemo(() => {
    let items = data.conversations;

    if (botId !== "all") {
      items = items.filter((c) => c.botId === botId);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.botName.toLowerCase().includes(q),
      );
    }

    return items;
  }, [data.conversations, botId, search]);

  // Group by date label
  const grouped = useMemo(() => {
    const map = new Map<ConversationItem["group"], ConversationItem[]>();
    for (const item of filtered) {
      const arr = map.get(item.group) ?? [];
      arr.push(item);
      map.set(item.group, arr);
    }
    return map;
  }, [filtered]);

  return (
    <div className="mx-auto w-full max-w-300 px-2 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Conversations
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All conversations across your bots.
        </p>
      </div>

      {/* Filter toolbar */}
      <form className="mb-6 flex gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <HugeiconsIcon
            icon={Search01Icon}
            size={12}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="text"
            placeholder="Search conversations..."
            className="pl-9"
            {...register("search")}
          />
        </div>

        {/* Bot filter */}
        <NativeSelect {...register("botId")}>
          <NativeSelectOption value="all">All</NativeSelectOption>
          {data.bots.map((bot) => (
            <NativeSelectOption key={bot.id} value={bot.id}>
              {bot.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </form>

      {/* List */}
      {filtered.length === 0 ? (
        <ConversationsEmpty />
      ) : (
        <div className="space-y-6">
          {GROUP_ORDER.map((group) => {
            const items = grouped.get(group);
            if (!items?.length) return null;
            return (
              <section key={group}>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {GROUP_LABELS[group]}
                </p>
                <div className="space-y-2">
                  {items.map((item) => (
                    <ConversationRow key={item.id} item={item} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
