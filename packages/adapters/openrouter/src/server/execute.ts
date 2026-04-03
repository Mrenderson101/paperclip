import type { AdapterExecutionContext, AdapterExecutionResult } from "@paperclipai/adapter-utils";
import {
  asString,
  asNumber,
  parseObject,
  buildPaperclipEnv,
  renderTemplate,
  joinPromptSections,
} from "@paperclipai/adapter-utils/server-utils";

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_TEMPERATURE = 0.7;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionResponse {
  id: string;
  model: string;
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

async function callOpenRouter(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  maxTokens: number,
  temperature: number,
  onLog: AdapterExecutionContext["onLog"],
): Promise<{ response: ChatCompletionResponse; raw: string }> {
  const url = `${baseUrl}/chat/completions`;
  const body = {
    model,
    messages,
    max_tokens: maxTokens,
    temperature,
  };

  await onLog("stderr", `[openrouter] POST ${url} model=${model}\n`);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://paperclip.dev",
      "X-Title": "Paperclip",
    },
    body: JSON.stringify(body),
  });

  const raw = await res.text();

  if (!res.ok) {
    throw new Error(`OpenRouter API error ${res.status}: ${raw.slice(0, 500)}`);
  }

  const response = JSON.parse(raw) as ChatCompletionResponse;
  return { response, raw };
}

export async function execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  const { runId, agent, config, context, onLog, onMeta } = ctx;

  const model = asString(config.model, "");
  if (!model) {
    return {
      exitCode: 1,
      signal: null,
      timedOut: false,
      errorMessage: "OpenRouter adapter: missing 'model' in adapterConfig",
    };
  }

  const apiKey = asString(config.apiKey, "");
  if (!apiKey) {
    return {
      exitCode: 1,
      signal: null,
      timedOut: false,
      errorMessage: "OpenRouter adapter: missing 'apiKey' in adapterConfig",
    };
  }

  const baseUrl = asString(config.baseUrl, DEFAULT_BASE_URL);
  const maxTokens = asNumber(config.maxTokens, DEFAULT_MAX_TOKENS);
  const temperature = asNumber(config.temperature, DEFAULT_TEMPERATURE);
  const fallbackModel = asString(config.fallbackModel, "");

  const promptTemplate = asString(
    config.promptTemplate,
    "You are agent {{agent.id}} ({{agent.name}}). Continue your Paperclip work.",
  );
  const templateData = {
    agentId: agent.id,
    companyId: agent.companyId,
    company: { id: agent.companyId },
    agent,
    run: { id: runId },
    context,
  };
  const prompt = renderTemplate(promptTemplate, templateData);

  if (onMeta) {
    await onMeta({
      adapterType: "openrouter",
      command: `openrouter:${model}`,
      prompt,
      context,
    });
  }

  const systemMessage: ChatMessage = {
    role: "system",
    content: `You are ${agent.name}, an AI agent working in the Paperclip system. Follow your assigned tasks precisely.`,
  };
  const userMessage: ChatMessage = {
    role: "user",
    content: prompt,
  };

  let usedModel = model;

  try {
    const { response } = await callOpenRouter(
      baseUrl, apiKey, model, [systemMessage, userMessage], maxTokens, temperature, onLog,
    );

    const content = response.choices?.[0]?.message?.content ?? "";
    usedModel = response.model || model;

    await onLog("stdout", content);

    return {
      exitCode: 0,
      signal: null,
      timedOut: false,
      usage: response.usage
        ? {
            inputTokens: response.usage.prompt_tokens,
            outputTokens: response.usage.completion_tokens,
          }
        : undefined,
      provider: "openrouter",
      model: usedModel,
      billingType: "api",
      summary: content.slice(0, 500),
      resultJson: { content, model: usedModel },
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);

    // Try fallback model if configured
    if (fallbackModel && fallbackModel !== model) {
      await onLog("stderr", `[openrouter] Primary model failed, trying fallback: ${fallbackModel}\n`);
      try {
        const { response } = await callOpenRouter(
          baseUrl, apiKey, fallbackModel, [systemMessage, userMessage], maxTokens, temperature, onLog,
        );

        const content = response.choices?.[0]?.message?.content ?? "";
        usedModel = response.model || fallbackModel;

        await onLog("stdout", content);

        return {
          exitCode: 0,
          signal: null,
          timedOut: false,
          usage: response.usage
            ? {
                inputTokens: response.usage.prompt_tokens,
                outputTokens: response.usage.completion_tokens,
              }
            : undefined,
          provider: "openrouter",
          model: usedModel,
          billingType: "api",
          summary: content.slice(0, 500),
          resultJson: { content, model: usedModel, fallbackUsed: true },
        };
      } catch (fallbackErr) {
        const fallbackMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
        return {
          exitCode: 1,
          signal: null,
          timedOut: false,
          errorMessage: `OpenRouter: primary failed (${errorMsg}), fallback also failed (${fallbackMsg})`,
          provider: "openrouter",
          model: fallbackModel,
          billingType: "api",
        };
      }
    }

    return {
      exitCode: 1,
      signal: null,
      timedOut: false,
      errorMessage: `OpenRouter: ${errorMsg}`,
      provider: "openrouter",
      model,
      billingType: "api",
    };
  }
}
