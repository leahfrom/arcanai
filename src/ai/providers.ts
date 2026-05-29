import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { createOllama } from "ollama-ai-provider-v2";
import { loadAiConfig, type AiConfig } from "../config.js";
import { createFallbackReading } from "./fallback.js";
import { buildReadingPrompt } from "./prompt.js";
import type {
  AiProvider,
  ProviderId,
  ReadingRequest,
  ReadingResponse,
} from "./types.js";

const openAiProvider: AiProvider = {
  id: "openai",
  label: "OpenAI",
  isAvailable: (config: AiConfig) => Boolean(config.openai.apiKey),
  async read(
    request: ReadingRequest,
    config: AiConfig,
  ): Promise<ReadingResponse> {
    const model = request.model ?? config.openai.model;
    const openai = createOpenAI({
      apiKey: config.openai.apiKey,
      baseURL: config.openai.baseUrl,
    });
    const result = await generateText({
      model: openai(model),
      prompt: buildReadingPrompt(request),
      temperature: 0.8,
      timeout: 45_000,
      maxRetries: 0,
    });

    const text = result.text.trim();
    if (!text) {
      throw new Error("OpenAI response did not include text.");
    }

    return {
      provider: "openai",
      model,
      text,
    };
  },
};

const ollamaProvider: AiProvider = {
  id: "ollama",
  label: "Ollama",
  isAvailable: () => true,
  async read(
    request: ReadingRequest,
    config: AiConfig,
  ): Promise<ReadingResponse> {
    const model = request.model ?? config.ollama.model;
    const ollama = createOllama({
      baseURL: config.ollama.baseUrl,
    });

    const result = await generateText({
      model: ollama(model),
      prompt: buildReadingPrompt(request),
      temperature: 0.8,
      timeout: 60_000,
      maxRetries: 0,
    });

    const text = result.text.trim();
    if (!text) {
      throw new Error("Ollama response did not include text.");
    }

    return {
      provider: "ollama",
      model,
      text,
    };
  },
};

export const providers = {
  openai: openAiProvider,
  ollama: ollamaProvider,
} as const;

export const readWithAi = async (
  providerId: ProviderId,
  request: ReadingRequest,
  config: AiConfig = loadAiConfig(),
): Promise<ReadingResponse> => {
  if (providerId === "none") {
    return createFallbackReading(request);
  }

  const candidates: AiProvider[] =
    providerId === "auto"
      ? [openAiProvider, ollamaProvider]
      : [providers[providerId]];

  for (const provider of candidates) {
    if (!provider.isAvailable(config)) {
      continue;
    }

    try {
      return await provider.read(request, config);
    } catch {
      continue;
    }
  }

  return createFallbackReading(request);
};
