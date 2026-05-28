import type { DrawnCard } from "./tarot/types.js";

export const formatCard = (card: DrawnCard): string => {
  const orientation = card.reversed ? "reversed" : "upright";
  const keywords = card.reversed ? card.reversedKeywords : card.keywords;

  return `${card.position}: ${card.name} (${orientation}) - ${keywords.slice(0, 4).join(", ")}`;
};

export const wrap = (text: string, width: number): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (current.length + word.length + 1 > width && current.length > 0) {
      lines.push(current);
      current = word;
    } else {
      current = current.length > 0 ? `${current} ${word}` : word;
    }
  }

  if (current.length > 0) {
    lines.push(current);
  }

  return lines;
};
