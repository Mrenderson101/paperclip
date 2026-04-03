import type { AdapterModel } from "@paperclipai/adapter-utils";

export const type = "openrouter";
export const label = "OpenRouter";

export const models: AdapterModel[] = [
  { id: "qwen/qwen3-coder-30b-a3b-instruct", label: "Qwen3 Coder 30B" },
  { id: "qwen/qwen3.5-flash-02-23", label: "Qwen3.5 Flash" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { id: "google/gemini-2.0-flash-lite-001", label: "Gemini 2.0 Flash Lite" },
  { id: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout 17B" },
  { id: "deepseek/deepseek-chat-v3-0324", label: "DeepSeek V3" },
];

export interface OpenRouterConfig {
  model: string;
  apiKey: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
  fallbackModel?: string;
}

export const agentConfigurationDoc = `# openrouter agent configuration

Adapter: openrouter

Core fields:
- model (string, required): OpenRouter model id (e.g. "qwen/qwen3.5-flash-02-23")
- apiKey (string, required): OpenRouter API key
- baseUrl (string, optional): defaults to "https://openrouter.ai/api/v1"
- maxTokens (number, optional): max completion tokens, default 4096
- temperature (number, optional): sampling temperature, default 0.7
- fallbackModel (string, optional): fallback model on rate limit or error

Notes:
- Uses OpenAI-compatible chat completions API
- Supports all models available on OpenRouter
- No session management (stateless HTTP calls)
`;
