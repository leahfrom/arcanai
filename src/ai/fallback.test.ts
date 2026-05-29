import { describe, expect, it } from "vitest";
import { createFallbackReading } from "./fallback.js";
import { drawCards } from "../tarot/draw.js";
import { getSpread } from "../tarot/spreads.js";

describe("createFallbackReading", () => {
  it("keeps the local reading reflective and bounded", () => {
    const spread = getSpread("single");
    const cards = drawCards({
      spread: "single",
      allowReversed: false,
      random: () => 0,
    });
    const reading = createFallbackReading({
      question: "Will I definitely win money?",
      spread,
      cards,
    });

    expect(reading.text).toContain("Reflective guidance only");
    expect(reading.text).toContain("no fate, medical, legal, or financial certainty");
    expect(reading.text).toContain("One practical next step");
  });
});
