import { deck } from "./deck.js";
import { getSpread } from "./spreads.js";
import type { Card, DrawnCard, SpreadId } from "./types.js";

export type DrawOptions = {
  spread: SpreadId;
  allowReversed?: boolean;
  random?: () => number;
};

const shuffle = <T>(items: T[], random: () => number): T[] => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex]!,
      shuffled[index]!,
    ];
  }

  return shuffled;
};

export const drawCards = ({
  spread,
  allowReversed = true,
  random = Math.random,
}: DrawOptions): DrawnCard[] => {
  const selectedSpread = getSpread(spread);
  const shuffled = shuffle(deck, random);

  return selectedSpread.positions.map((position, index) => {
    const card = shuffled[index] as Card;

    return {
      ...card,
      position,
      reversed: allowReversed ? random() >= 0.72 : false,
    };
  });
};
