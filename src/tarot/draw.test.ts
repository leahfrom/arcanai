import { describe, expect, it } from "vitest";
import { deck } from "./deck.js";
import { drawCards } from "./draw.js";

describe("tarot deck", () => {
  it("contains a complete 78-card deck", () => {
    expect(deck).toHaveLength(78);
    expect(new Set(deck.map((card) => card.name)).size).toBe(78);
  });
});

describe("drawCards", () => {
  it("draws unique cards for the chosen spread", () => {
    const cards = drawCards({ spread: "cross", random: () => 0.2 });

    expect(cards).toHaveLength(5);
    expect(new Set(cards.map((card) => card.name)).size).toBe(5);
    expect(cards.map((card) => card.position)).toEqual([
      "Center",
      "Challenge",
      "Hidden influence",
      "Advice",
      "Likely movement",
    ]);
  });

  it("can disable reversed cards", () => {
    const cards = drawCards({
      spread: "three",
      allowReversed: false,
      random: () => 0.99,
    });

    expect(cards.every((card) => !card.reversed)).toBe(true);
  });
});
