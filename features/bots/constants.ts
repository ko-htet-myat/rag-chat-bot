export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  description: string;
  badge?: string;
  contextWindow: string;
}

export const POPULAR_MODELS: ModelOption[] = [
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    description: "Fast, intelligent, and affordable model for general tasks",
    badge: "Recommended",
    contextWindow: "128k",
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    description: "Exceptional reasoning, nuanced writing, and advanced coding",
    badge: "High Quality",
    contextWindow: "200k",
  },
  {
    id: "anthropic/claude-3.5-haiku",
    name: "Claude 3.5 Haiku",
    provider: "Anthropic",
    description: "Ultra-fast response times with high accuracy and low cost",
    badge: "Ultra Fast",
    contextWindow: "200k",
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B",
    provider: "Meta",
    description: "Open-weights flagship performance on par with closed models",
    badge: "Open Source",
    contextWindow: "128k",
  },
  {
    id: "google/gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    provider: "Google",
    description: "Next-gen multimodal speed and reasoning with high throughput",
    badge: "Free Tier",
    contextWindow: "1M",
  },
  {
    id: "deepseek/deepseek-chat",
    name: "DeepSeek V3",
    provider: "DeepSeek",
    description: "Strong reasoning and versatility at a very low price point",
    badge: "Budget",
    contextWindow: "64k",
  },
];

export interface PromptPreset {
  title: string;
  description: string;
  prompt: string;
}

export const PROMPT_PRESETS: PromptPreset[] = [
  {
    title: "Customer Support",
    description:
      "Friendly, empathetic, and resolution-oriented support assistant",
    prompt: `You are an expert customer support specialist for our company.
Your role is to assist users with their questions, troubleshoot issues politely and efficiently, and provide accurate, step-by-step guidance.
Always maintain a helpful, welcoming, and empathetic tone. If you are uncertain of an answer, politely acknowledge it and advise contacting human support.`,
  },
  {
    title: "Coding Assistant",
    description:
      "Technical mentor for reviewing code, debugging, and explaining architecture",
    prompt: `You are an expert software engineer and technical consultant.
You provide clean, modern, well-commented, and robust code snippets with brief, insightful explanations.
Prioritize type safety, best practices, performance, and security. Point out edge cases and offer idiomatic solutions.`,
  },
  {
    title: "Sales & Leads",
    description:
      "Professional agent to qualify leads, answer product FAQs, and drive demos",
    prompt: `You are a consultative sales representative.
Your objective is to understand user requirements, explain how our solutions solve their pain points, address objections, and encourage booking a demo or signing up.
Be persuasive yet honest, concise, and focused on customer value.`,
  },
  {
    title: "General Assistant",
    description:
      "Versatile, concise, and smart AI assistant for everyday queries",
    prompt: `You are a versatile, intelligent AI assistant.
Your goal is to provide clear, well-structured, and concise answers to any user inquiry.
Format responses using markdown when helpful (bullet points, bold highlights, code blocks).`,
  },
];
