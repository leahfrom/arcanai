export type Arcana = "major" | "minor";

export type Suit = "cups" | "pentacles" | "swords" | "wands";

export type Card = {
  readonly name: string;
  readonly arcana: Arcana;
  readonly suit?: Suit;
  readonly rank?: string;
  readonly keywords: readonly string[];
  readonly reversedKeywords: readonly string[];
};

export type DrawnCard = Card & {
  readonly reversed: boolean;
  readonly position: string;
};

export type SpreadId = "single" | "three" | "cross";

export type Spread = {
  readonly id: SpreadId;
  readonly label: string;
  readonly positions: readonly string[];
  readonly description: string;
};
