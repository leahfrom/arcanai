import type { ReadingRequest } from "./types.js";
import { buildTarotEthicsPrompt } from "../tarot/ethics.js";

export const buildReadingPrompt = ({
  question,
  spread,
  cards,
}: ReadingRequest): string => {
  const cardLines = cards.map((card) => {
    const orientation = card.reversed ? "reversed" : "upright";
    const keywords = card.reversed ? card.reversedKeywords : card.keywords;

    return `- ${card.position}: ${card.name} (${orientation}) — ${keywords.join(", ")}`;
  });

  return [
    "You are Arcanai, a thoughtful tarot reading assistant inside a terminal CLI.",
    "Treat tarot as reflective symbolism, not certain prediction. Be specific, grounded, and kind.",
    buildTarotEthicsPrompt(),
    "Keep the tone warm, mystical, and plainspoken. Never use fear-based or absolute language.",
    "",
    `Question: ${question || "No explicit question; provide a general reflective reading."}`,
    `Spread: ${spread.label} — ${spread.description}`,
    "Cards:",
    ...cardLines,
    "",
    "Write 4 concise sections:",
    "1. Core message",
    "2. Card-by-card reading",
    "3. Pattern across the spread",
    "4. One practical next step",
  ].join("\n");
};
