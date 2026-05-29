export type Arcana = "major" | "minor";

export type Suit = "cups" | "pentacles" | "swords" | "wands";

export type Card = {
  name: string;
  arcana: Arcana;
  suit?: Suit;
  rank?: string;
  keywords: string[];
  reversedKeywords: string[];
};

export type DrawnCard = Card & {
  reversed: boolean;
  position: string;
};

export type SpreadId = "single" | "three" | "cross";

export type Spread = {
  id: SpreadId;
  label: string;
  positions: string[];
  description: string;
};
