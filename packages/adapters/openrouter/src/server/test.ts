import type { AdapterEnvironmentTestContext, AdapterEnvironmentTestResult, AdapterEnvironmentCheck } from "@paperclipai/adapter-utils";
import { asString } from "@paperclipai/adapter-utils/server-utils";

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";

export async function testEnvironment(ctx: AdapterEnvironmentTestContext): Promise<AdapterEnvironmentTestResult> {
  const checks: AdapterEnvironmentCheck[] = [];
  const config = ctx.config as Record<string, unknown>;
  const apiKey = asString(config.apiKey, "");
  const baseUrl = asString(config.baseUrl, DEFAULT_BASE_URL);

  if (!apiKey) {
    checks.push({
      code: "openrouter_api_key",
      level: "error",
      message: "Missing OpenRouter API key",
      hint: "Set 'apiKey' in the agent's adapterConfig",
    });
    return { adapterType: "openrouter", status: "fail", checks, testedAt: new Date().toISOString() };
  }

  checks.push({
    code: "openrouter_api_key",
    level: "info",
    message: "API key configured",
  });

  try {
    const res = await fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (res.ok) {
      checks.push({
        code: "openrouter_api_reachable",
        level: "info",
        message: `OpenRouter API reachable (${baseUrl})`,
      });
    } else {
      checks.push({
        code: "openrouter_api_reachable",
        level: "error",
        message: `OpenRouter API returned ${res.status}`,
        hint: "Check your API key and network connectivity",
      });
      return { adapterType: "openrouter", status: "fail", checks, testedAt: new Date().toISOString() };
    }
  } catch (err) {
    checks.push({
      code: "openrouter_api_reachable",
      level: "error",
      message: `Cannot reach OpenRouter API: ${err instanceof Error ? err.message : String(err)}`,
      hint: "Check your network connectivity",
    });
    return { adapterType: "openrouter", status: "fail", checks, testedAt: new Date().toISOString() };
  }

  const model = asString(config.model, "");
  if (model) {
    checks.push({
      code: "openrouter_model",
      level: "info",
      message: `Model configured: ${model}`,
    });
  } else {
    checks.push({
      code: "openrouter_model",
      level: "warn",
      message: "No model configured",
      hint: "Set 'model' in the agent's adapterConfig",
    });
    return { adapterType: "openrouter", status: "warn", checks, testedAt: new Date().toISOString() };
  }

  return { adapterType: "openrouter", status: "pass", checks, testedAt: new Date().toISOString() };
}
