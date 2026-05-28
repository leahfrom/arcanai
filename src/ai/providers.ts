import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { createOllama } from "ollama-ai-provider-v2";
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
  isAvailable: () => Boolean(process.env.OPENAI_API_KEY),
  async read(request: ReadingRequest): Promise<ReadingResponse> {
    const model = request.model ?? process.env.OPENAI_MODEL ?? "gpt-5.5";
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
  async read(request: ReadingRequest): Promise<ReadingResponse> {
    const baseUrl = process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434/api";
    const model =
      request.model ?? process.env.ARCANAI_OLLAMA_MODEL ?? "llama3.2";
    const ollama = createOllama({
      baseURL: baseUrl,
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
): Promise<ReadingResponse> => {
  if (providerId === "none") {
    return createFallbackReading(request);
  }

  const candidates: readonly AiProvider[] =
    providerId === "auto"
      ? [openAiProvider, ollamaProvider]
      : [providers[providerId]];

  for (const provider of candidates) {
    if (!provider.isAvailable()) {
      continue;
    }

    try {
      return await provider.read(request);
    } catch {
      continue;
    }
  }

  return createFallbackReading(request);
};
