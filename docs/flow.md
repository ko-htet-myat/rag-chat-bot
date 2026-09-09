User
│
▼
Dashboard / Widget
│
▼
Hono
│
│ POST /chat
▼
chat.route.ts
│
▼
chat.service.ts
│
▼
AI Runtime
│
├── Determine Bot
│
├── Load Bot Config
│
├── Load Conversation
│
▼
AI Orchestrator
│
├── RAG
│ ├── Embed query
│ ├── Vector search
│ ├── Retrieve chunks
│ ├── Build context
│ └── Citations
│
├── Tools
│ └── Execute if required
│
└── Agent
└── Decide next action
│
▼
AI Model
│
▼
Stream response
│
▼
Save Message
│
▼
Client
