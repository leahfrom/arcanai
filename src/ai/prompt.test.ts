import { describe, expect, it } from "vitest";
import { buildReadingPrompt } from "./prompt.js";
import { drawCards } from "../tarot/draw.js";
import { getSpread } from "../tarot/spreads.js";

describe("buildReadingPrompt", () => {
  it("includes the question, spread, and cards", () => {
    const spread = getSpread("single");
    const cards = drawCards({
      spread: "single",
      allowReversed: false,
      random: () => 0,
    });
    const prompt = buildReadingPrompt({
      question: "What wants my attention?",
      spread,
      cards,
    });

    expect(prompt).toContain("What wants my attention?");
    expect(prompt).toContain("Single card");
    expect(prompt).toContain(cards[0]!.name);
    expect(prompt).toContain("Treat tarot as reflective symbolism");
  });
});
