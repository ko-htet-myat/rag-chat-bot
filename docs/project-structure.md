inno-chat-bot/
│
├── app/ # Next.js App Router
│ │
│ ├── api/
│ │ ├── [[...route]]/
│ │ │ └── route.ts # Hono entry point
│ │ │
│ │ └── auth/
│ │ └── [...all]/
│ │ └── route.ts # Better Auth
│ │
│ ├── (auth)/
│ │ ├── sign-in/
│ │ │ └── page.tsx
│ │ └── sign-up/
│ │ └── page.tsx
│ │
│ ├── (dashboard)/
│ │ ├── layout.tsx
│ │ ├── page.tsx # Dashboard
│ │ │
│ │ ├── bots/
│ │ │ ├── page.tsx
│ │ │ ├── create/
│ │ │ │ └── page.tsx
│ │ │ └── [botId]/
│ │ │ ├── page.tsx
│ │ │ ├── settings/
│ │ │ ├── knowledge/
│ │ │ ├── tools/
│ │ │ └── widget/
│ │ │
│ │ ├── conversations/
│ │ │ ├── page.tsx
│ │ │ └── [conversationId]/
│ │ │ └── page.tsx
│ │ │
│ │ ├── knowledge/
│ │ │ ├── page.tsx
│ │ │ ├── create/
│ │ │ │ └── page.tsx
│ │ │ └── [knowledgeBaseId]/
│ │ │ ├── page.tsx
│ │ │ └── documents/
│ │ │
│ │ ├── widget/
│ │ │ └── page.tsx
│ │ │
│ │ └── settings/
│ │ └── page.tsx
│ │
│ ├── globals.css
│ └── layout.tsx
│
│
├── components/ # Shared UI
│ │
│ ├── layouts/
│ │ ├── DashboardLayout.tsx
│ │ ├── menus.tsx
│ │ └── sidebar/
│ │ ├── app-sidebar.tsx
│ │ ├── nav-main.tsx
│ │ ├── nav-user.tsx
│ │ └── team-switcher.tsx
│ │
│ └── ui/ # shadcn/ui
│ ├── alert-dialog.tsx
│ ├── avatar.tsx
│ ├── badge.tsx
│ ├── breadcrumb.tsx
│ ├── button.tsx
│ ├── card.tsx
│ ├── chart.tsx
│ ├── collapsible.tsx
│ ├── dropdown-menu.tsx
│ ├── field.tsx
│ ├── input.tsx
│ ├── label.tsx
│ ├── native-select.tsx
│ ├── separator.tsx
│ ├── sheet.tsx
│ ├── sidebar.tsx
│ ├── skeleton.tsx
│ ├── slider.tsx
│ ├── sonner.tsx
│ ├── switch.tsx
│ ├── tabs.tsx
│ ├── textarea.tsx
│ └── tooltip.tsx
│
│
├── features/ # Product/domain features
│ │
│ ├── auth/
│ │ ├── components/
│ │ │ ├── signin.form.tsx
│ │ │ └── signup.form.tsx
│ │ ├── types/
│ │ └── validations/
│ │ └── index.ts
│ │
│ ├── bots/
│ │ ├── actions/
│ │ ├── components/
│ │ ├── queries/
│ │ ├── validations/
│ │ ├── constants.ts
│ │ ├── types.ts
│ │ └── index.ts
│ │
│ ├── conversations/
│ │ ├── components/
│ │ ├── actions/
│ │ ├── queries/
│ │ ├── hooks/
│ │ ├── types.ts
│ │ └── index.ts
│ │
│ ├── knowledge/
│ │ ├── components/
│ │ ├── actions/
│ │ ├── queries/
│ │ ├── hooks/
│ │ ├── validations/
│ │ ├── types.ts
│ │ └── index.ts
│ │
│ └── widget/
│ ├── components/
│ ├── actions/
│ ├── queries/
│ ├── validations/
│ ├── types.ts
│ └── index.ts
│
│
├── ai/ # ⭐ AI ENGINE
│ │
│ ├── runtime/ # AI provider abstraction
│ │ ├── provider.ts
│ │ ├── models.ts
│ │ ├── embeddings.ts
│ │ ├── generate.ts
│ │ └── stream.ts
│ │
│ ├── rag/ # ⭐ RAG system
│ │ │
│ │ ├── ingestion/
│ │ │ ├── parser.ts
│ │ │ ├── loaders/
│ │ │ │ ├── pdf.loader.ts
│ │ │ │ ├── text.loader.ts
│ │ │ │ ├── markdown.loader.ts
│ │ │ │ └── web.loader.ts
│ │ │ ├── chunker.ts
│ │ │ ├── embedder.ts
│ │ │ └── ingest.ts
│ │ │
│ │ ├── retrieval/
│ │ │ ├── retriever.ts
│ │ │ ├── vector-search.ts
│ │ │ ├── full-text-search.ts
│ │ │ └── hybrid-search.ts
│ │ │
│ │ ├── reranking/
│ │ │ └── reranker.ts
│ │ │
│ │ ├── context/
│ │ │ ├── builder.ts
│ │ │ └── formatter.ts
│ │ │
│ │ ├── citations/
│ │ │ ├── citation.ts
│ │ │ └── source.ts
│ │ │
│ │ └── rag.ts
│ │
│ ├── tools/ # Future tool calling
│ │ ├── registry.ts
│ │ ├── types.ts
│ │ ├── executor.ts
│ │ └── built-in/
│ │ ├── search.tool.ts
│ │ ├── calculator.tool.ts
│ │ └── ...
│ │
│ ├── agents/ # Future agents
│ │ ├── registry.ts
│ │ ├── types.ts
│ │ ├── executor.ts
│ │ └── agents/
│ │ ├── rag.agent.ts
│ │ └── general.agent.ts
│ │
│ ├── memory/ # Future memory
│ │ ├── memory.ts
│ │ ├── conversation-memory.ts
│ │ └── user-memory.ts
│ │
│ ├── prompts/
│ │ ├── system.ts
│ │ ├── rag.ts
│ │ └── agent.ts
│ │
│ └── evaluation/ # Future AI evaluation
│ ├── datasets/
│ ├── evaluators/
│ └── metrics/
│
│
├── server/ # ⭐ Backend / API layer
│ │
│ ├── index.ts # Hono app
│ │
│ ├── middleware/
│ │ ├── auth.ts
│ │ ├── cors.ts
│ │ ├── rate-limit.ts
│ │ └── error-handler.ts
│ │
│ ├── routes/
│ │ ├── chat.ts
│ │ ├── widget.ts
│ │ ├── bots.ts
│ │ ├── knowledge.ts
│ │ └── conversations.ts
│ │
│ ├── services/
│ │ ├── chat.service.ts
│ │ ├── widget.service.ts
│ │ ├── bot.service.ts
│ │ ├── knowledge.service.ts
│ │ └── conversation.service.ts
│ │
│ └── schemas/
│ ├── chat.schema.ts
│ ├── widget.schema.ts
│ ├── bot.schema.ts
│ └── knowledge.schema.ts
│
│
├── db/ # ⭐ Database
│ │
│ ├── schema/
│ │ ├── auth.ts
│ │ ├── organizations.ts
│ │ ├── bots.ts
│ │ ├── knowledge-bases.ts
│ │ ├── documents.ts
│ │ ├── document-chunks.ts
│ │ ├── conversations.ts
│ │ ├── messages.ts
│ │ ├── widgets.ts
│ │ ├── tools.ts
│ │ └── integrations.ts
│ │
│ ├── migrations/
│ │ └── ...
│ │
│ ├── index.ts
│ └── seed.ts
│
│
├── lib/ # Generic application utilities
│ │
│ ├── auth.ts
│ ├── auth-client.ts
│ ├── safe-action.ts
│ ├── utils.ts
│ │
│ ├── env/
│ │ └── index.ts
│ │
│ ├── storage/
│ │ ├── storage.ts
│ │ └── local-storage.ts
│ │
│ └── documents/
│ └── process-document.ts
│
│
├── hooks/
│ ├── use-mobile.ts
│ └── ...
│
│
├── public/
│ ├── widget.js # ⭐ Public embeddable widget
│ └── images/
│
│
├── docs/
│ ├── architecture.md
│ ├── rag.md
│ ├── widget.md
│ ├── tools.md
│ ├── agents.md
│ └── strategy.md
│
│
├── tests/
│ ├── unit/
│ │ ├── ai/
│ │ ├── server/
│ │ └── features/
│ │
│ └── integration/
│ ├── rag/
│ ├── chat/
│ └── widget/
│
│
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tsconfig.json
├── next.config.ts
├── drizzle.config.ts
├── components.json
├── postcss.config.mjs
├── eslint.config.mjs
├── proxy.ts
└── skills-lock.json
