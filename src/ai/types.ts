import type { DrawnCard, Spread } from "../tarot/types.js";
import type { AiConfig } from "../config.js";

export type ReadingRequest = {
  readonly question: string;
  readonly spread: Spread;
  readonly cards: readonly DrawnCard[];
  readonly model?: string;
};

export type ReadingResponse = {
  readonly provider: string;
  readonly model?: string;
  readonly text: string;
  readonly usedFallback?: boolean;
};

export type AiProvider = {
  readonly id: string;
  readonly label: string;
  readonly isAvailable: (config: AiConfig) => boolean;
  readonly read: (
    request: ReadingRequest,
    config: AiConfig,
  ) => Promise<ReadingResponse>;
};

export type ProviderId = "auto" | "openai" | "ollama" | "none";
