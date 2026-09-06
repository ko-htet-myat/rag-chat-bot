# Project AGENTS.md: AI Assistant Context & Guidelines

## 🎯 1. Overview & Core Philosophy

This repository is an AI-powered Chat Application built with a modern, high-performance TypeScript stack.
AI agents working on this codebase must strictly adhere to the project architecture, separation of concerns, and coding standards outlined below.

> **Rule #1:** Never guess. If you are uncertain about a schema or helper function, check existing code or ask.
> **Rule #2:** Prioritize type safety, performance, and clear separation between Dashboard logic and API streaming.

---

## 🛠️ 2. Tech Stack & Architecture

- **Framework (Dashboard):** Next.js App Router (Server Components & Server Actions for mutations).
- **API & Streaming Engine:** Hono Framework (for high-throughput endpoints, chat streaming, and public widget).
- **Database Layer:** PostgreSQL with `pgvector` extension.
- **ORM:** Drizzle ORM (Type-safe queries and schema definition).
- **Authentication:** Better Auth (Unified session management across Next.js and Hono).
- **AI SDK:** Vercel AI SDK Core (`ai`, `@ai-sdk/google`, `@ai-sdk/openai`).
- **Validation:** Zod schemas.

---

## 📂 3. Directory Structure & Responsibilities

- `src/app/` -> Next.js App Router UI pages and Server Actions ONLY.
- `src/features/` -> Feature base (components,hooks,types,validation,actions).
- `src/server/` -> Hono API server logic.
  - `src/server/routes/chat.ts` -> LLM Streaming & AI logic using Vercel AI SDK.
  - `src/server/routes/widget.ts` -> Public widget endpoints with CORS & Rate Limiting.
- `src/db/` -> Database schema and connection.
  - `src/db/schema/` -> Drizzle schema definitions (including vector columns).
- `src/lib/` -> Shared utilities, auth clients, and helpers.

---

## 📏 4. Coding Standards & Guidelines for AI Agents

### A. Next.js Server Actions

- Use Server Actions exclusively for Dashboard UI mutations (Form submissions, settings updates).
- Always validate input arguments using **Zod** before executing database queries.
- Use `revalidatePath` or `revalidateTag` to purge Next.js cache after data updates.

### B. Hono Endpoints & Streaming

- Keep Hono routes clean. Separate CORS, Rate Limiting, and Authentication into middleware.
- For LLM Streaming, use `streamText` from Vercel AI SDK and return `result.toDataStreamResponse()`.
- Public widget routes MUST include CORS configuration and Upstash Redis rate limiting.

### C. Drizzle ORM & Database

- Do NOT write raw SQL unless performing complex `pgvector` Cosine Similarity calculations (`<=>`).
- Keep schemas modular under `src/db/schema/`.
- Always generate migrations using `drizzle-kit` when modifying schemas.

### D. Better Auth & Security

- Never bypass session verification on protected routes.
- Use `auth.api.getSession()` inside Hono middleware to protect API routes.

---

## 🚀 5. Workflow for AI Agent Execution

When instructed to complete a task:

1. **Analyze First:** Read relevant schema files and existing route structures.
2. **Draft Changes:** Ensure TypeScript types strictly align without using `any`.
3. **Execute Incrementally:** Write modular code, keeping Server Actions and Hono routes separate.
4. **Self-Check:** Verify that input validation, CORS, and Rate Limits are handled if modifying public endpoints.
