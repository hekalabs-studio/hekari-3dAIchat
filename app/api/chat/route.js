// ──────────────────────────────────────────────
// API Route: POST /api/chat
// ──────────────────────────────────────────────
// Multi-provider AI backend using Vercel AI SDK.
// Supports Anthropic, Google Gemini, xAI (Grok), and Mistral.
// Dynamically routes based on `modelProvider` from the request body.

import { streamText, convertToModelMessages } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { xai } from "@ai-sdk/xai";
import { groq } from "@ai-sdk/groq";
import { mistral } from "@ai-sdk/mistral";
import { buildSystemPrompt } from "@/lib/systemPrompt";
import { prepareContext } from "@/lib/memoryManager";

/**
 * Provider registry - maps provider keys to AI SDK model instances.
 * Each entry returns a LanguageModel from the corresponding SDK package.
 */
const PROVIDERS = {
  google: {
    label: "Gemini 3.6 Flash",
    checkKey: () => {
      const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      return key && key.length > 10;
    },
    create: () => google("gemini-2.5-flash"),
  },
  groq: {
    label: "Groq (Ultra Fast)",
    checkKey: () => {
      const key =
        process.env.GROQ_API_KEY ||
        (process.env.XAI_API_KEY?.startsWith("gsk_")
          ? process.env.XAI_API_KEY
          : null);
      return key && key.length > 10;
    },
    create: () => groq("openai/gpt-oss-20b"),
  },
  mistral: {
    label: "Mistral 7B",
    checkKey: () => {
      const key = process.env.MISTRAL_API_KEY;
      return key && key.length > 10;
    },
    create: () => mistral("open-mistral-7b"),
  },
  anthropic: {
    label: "Claude Sonnet 3.5",
    checkKey: () => {
      const key = process.env.ANTHROPIC_API_KEY;
      return key && !key.includes("xxxxx") && key.length > 10;
    },
    create: () => anthropic("claude-3-5-sonnet-latest"),
  },
  xai: {
    label: "Groq / xAI",
    checkKey: () => {
      const key = process.env.GROQ_API_KEY || process.env.XAI_API_KEY;
      return key && key.length > 10;
    },
    create: () => {
      const key = process.env.XAI_API_KEY || process.env.GROQ_API_KEY || "";
      if (key.startsWith("gsk_")) {
        return groq("openai/gpt-oss-20b");
      }
      return xai("grok-2-latest");
    },
  },
};

/**
 * Resolve a model from the provider key.
 * Falls back to Google if the key is unknown.
 */
function getModel(providerKey) {
  const provider = PROVIDERS[providerKey] || PROVIDERS.google;
  if (!PROVIDERS[providerKey]) {
    console.warn(
      `[Chat API] Unknown provider "${providerKey}", falling back to Google.`
    );
  }

  if (provider.checkKey && !provider.checkKey()) {
    throw new Error(
      `API key for "${provider.label}" is not configured or is a placeholder in .env.local.`
    );
  }

  return provider.create();
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      messages,
      modelProvider = "google",
      companionName,
      userName,
      persona,
      modelId,
      customInstructions,
    } = body;

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: "Messages array is required." },
        { status: 400 }
      );
    }

    // ── 1. Resolve the model from the provider key ──
    const model = getModel(modelProvider);

    // ── 2. Apply memory management (trim to context window) ──
    const { messages: managedMessages, summary } = prepareContext(messages);

    // ── 3. Build system prompt with persona and optional summary injection ──
    const systemPrompt = buildSystemPrompt(summary, {
      companionName,
      userName,
      persona,
      modelId,
      customInstructions,
    });

    // ── 4. Normalize UI messages so parts array exists (AI SDK v7 compatibility) ──
    const normalizedMessages = managedMessages.map((m) => {
      if (Array.isArray(m.parts) && m.parts.length > 0) return m;
      const textContent = typeof m.content === "string" ? m.content : "";
      return {
        ...m,
        parts: [{ type: "text", text: textContent }],
      };
    });

    // ── 5. Convert UI messages to model messages (must await in AI SDK v7) ──
    const modelMessages = await convertToModelMessages(normalizedMessages);

    // ── 5. Stream the response ──
    const result = streamText({
      model,
      system: systemPrompt,
      messages: modelMessages,
      maxTokens: 1024,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[Chat API] Request error:", error);

    // Provide a helpful error for missing/invalid API keys
    if (
      error.message?.includes("API key") ||
      error.message?.includes("apiKey") ||
      error.message?.includes("authentication") ||
      error.message?.includes("401")
    ) {
      return Response.json(
        {
          error: error.message || `API key not configured for the selected provider. Check your .env.local file.`,
        },
        { status: 401 }
      );
    }

    return Response.json(
      { error: error.message || "Internal server error." },
      { status: 500 }
    );
  }
}
