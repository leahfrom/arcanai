import type { ReadingRequest, ReadingResponse } from "./types.js";
import { tarotBoundaryNote } from "../tarot/ethics.js";

export const createFallbackReading = ({
  question,
  cards,
}: ReadingRequest): ReadingResponse => {
  const focus =
    question.trim().length > 0
      ? `For "${question.trim()}",`
      : "For this reading,";
  const cardLines = cards.map((card) => {
    const keywords = card.reversed ? card.reversedKeywords : card.keywords;
    const orientation = card.reversed ? "reversed" : "upright";

    return `${card.position}: ${card.name} ${orientation} points to ${keywords.slice(0, 3).join(", ")}.`;
  });
  const strongest = cards[0];
  const strongestKeywords = strongest
    ? (strongest.reversed ? strongest.reversedKeywords : strongest.keywords)
        .slice(0, 2)
        .join(" and ")
    : "attention and patience";

  return {
    provider: "local",
    text: [
      "Core message",
      `${focus} the cards ask you to slow down enough to notice the shape of the situation.`,
      tarotBoundaryNote,
      "",
      "Card-by-card reading",
      ...cardLines,
      "",
      "Pattern across the spread",
      `${cards.length > 1 ? "Read together, these cards suggest a movement from the first position toward the last." : "This single card is the whole weather system for the moment."} Let ${strongestKeywords} be the first thread you follow.`,
      "",
      "One practical next step",
      "Write one sentence naming what you know, one naming what you fear, and one naming the smallest honest action available today.",
    ].join("\n"),
    usedFallback: true,
  };
};
