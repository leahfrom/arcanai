import type { DrawnCard, Spread } from "../tarot/types.js";
import type { AiConfig } from "../config.js";

export type ReadingRequest = {
  question: string;
  spread: Spread;
  cards: DrawnCard[];
  model?: string;
};

export type ReadingResponse = {
  provider: string;
  model?: string;
  text: string;
  usedFallback?: boolean;
};

export type AiProvider = {
  id: string;
  label: string;
  isAvailable: (config: AiConfig) => boolean;
  read: (
    request: ReadingRequest,
    config: AiConfig,
  ) => Promise<ReadingResponse>;
};

export type ProviderId = "auto" | "openai" | "ollama" | "none";
