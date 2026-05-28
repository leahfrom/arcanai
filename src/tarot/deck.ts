import type { Card, Suit } from "./types.js";

const majorArcanaSeed: ReadonlyArray<
  readonly [string, readonly string[], readonly string[]]
> = [
  [
    "The Fool",
    ["beginnings", "trust", "leap of faith"],
    ["recklessness", "hesitation", "naivety"],
  ],
  [
    "The Magician",
    ["will", "skill", "manifestation"],
    ["misdirection", "untapped power", "manipulation"],
  ],
  [
    "The High Priestess",
    ["intuition", "mystery", "inner knowing"],
    ["secrets", "disconnection", "surface answers"],
  ],
  [
    "The Empress",
    ["nurture", "abundance", "creation"],
    ["overgiving", "stagnation", "creative block"],
  ],
  [
    "The Emperor",
    ["structure", "authority", "stability"],
    ["rigidity", "control", "fragile order"],
  ],
  [
    "The Hierophant",
    ["tradition", "teaching", "shared meaning"],
    ["conformity", "dogma", "stale rules"],
  ],
  [
    "The Lovers",
    ["choice", "alignment", "union"],
    ["misalignment", "avoidance", "divided values"],
  ],
  [
    "The Chariot",
    ["momentum", "discipline", "victory"],
    ["scattered force", "delay", "willfulness"],
  ],
  [
    "Strength",
    ["courage", "patience", "soft power"],
    ["self-doubt", "force", "frayed nerve"],
  ],
  [
    "The Hermit",
    ["solitude", "wisdom", "inner lamp"],
    ["isolation", "withdrawal", "lost signal"],
  ],
  [
    "Wheel of Fortune",
    ["cycles", "turning point", "chance"],
    ["resistance", "bad timing", "repeating pattern"],
  ],
  [
    "Justice",
    ["truth", "balance", "accountability"],
    ["bias", "avoidance", "unfairness"],
  ],
  [
    "The Hanged Man",
    ["pause", "surrender", "new perspective"],
    ["stalling", "martyrdom", "refusal to release"],
  ],
  [
    "Death",
    ["ending", "transformation", "clearing"],
    ["clinging", "slow transition", "fear of change"],
  ],
  [
    "Temperance",
    ["integration", "patience", "healing"],
    ["excess", "imbalance", "rushed repair"],
  ],
  [
    "The Devil",
    ["attachment", "shadow", "temptation"],
    ["release", "awareness", "breaking a chain"],
  ],
  [
    "The Tower",
    ["rupture", "truth revealed", "liberation"],
    ["fear of collapse", "delayed shock", "denial"],
  ],
  [
    "The Star",
    ["hope", "renewal", "guidance"],
    ["discouragement", "dimmed faith", "distance from purpose"],
  ],
  [
    "The Moon",
    ["dreams", "uncertainty", "subconscious"],
    ["confusion lifting", "anxiety", "hidden fear"],
  ],
  [
    "The Sun",
    ["clarity", "joy", "vitality"],
    ["muted joy", "overexposure", "temporary cloud"],
  ],
  [
    "Judgement",
    ["calling", "reckoning", "awakening"],
    ["self-judgment", "avoidance", "unfinished lesson"],
  ],
  [
    "The World",
    ["completion", "wholeness", "arrival"],
    ["loose ends", "delay", "almost there"],
  ],
];

const majorArcana: readonly Card[] = majorArcanaSeed.map(
  ([name, keywords, reversedKeywords]) => ({
    name,
    arcana: "major",
    keywords,
    reversedKeywords,
  }),
);

const suitProfiles: Record<
  Suit,
  {
    readonly theme: string;
    readonly keywords: readonly string[];
    readonly reversedKeywords: readonly string[];
  }
> = {
  cups: {
    theme: "emotion",
    keywords: ["feeling", "connection", "receptivity"],
    reversedKeywords: ["emotional static", "blocked tenderness", "avoidance"],
  },
  pentacles: {
    theme: "material life",
    keywords: ["body", "work", "resources"],
    reversedKeywords: ["instability", "scarcity thinking", "neglect"],
  },
  swords: {
    theme: "mind",
    keywords: ["thought", "truth", "conflict"],
    reversedKeywords: ["confusion", "overthinking", "unspoken truth"],
  },
  wands: {
    theme: "fire",
    keywords: ["energy", "desire", "action"],
    reversedKeywords: ["burnout", "delay", "scattered spark"],
  },
};

const rankProfiles: ReadonlyArray<{
  readonly rank: string;
  readonly keywords: readonly string[];
  readonly reversedKeywords: readonly string[];
}> = [
  {
    rank: "Ace",
    keywords: ["seed", "opening", "potential"],
    reversedKeywords: ["false start", "blocked beginning", "unused gift"],
  },
  {
    rank: "Two",
    keywords: ["choice", "duality", "partnership"],
    reversedKeywords: ["imbalance", "indecision", "split attention"],
  },
  {
    rank: "Three",
    keywords: ["growth", "collaboration", "first results"],
    reversedKeywords: ["friction", "delay", "thin support"],
  },
  {
    rank: "Four",
    keywords: ["foundation", "pause", "stability"],
    reversedKeywords: ["restlessness", "stagnation", "fragile base"],
  },
  {
    rank: "Five",
    keywords: ["conflict", "change", "pressure"],
    reversedKeywords: ["repair", "avoidance", "exhaustion"],
  },
  {
    rank: "Six",
    keywords: ["movement", "recovery", "exchange"],
    reversedKeywords: ["stuckness", "debt", "uneven give-and-take"],
  },
  {
    rank: "Seven",
    keywords: ["assessment", "challenge", "strategy"],
    reversedKeywords: ["doubt", "shortcuts", "lost nerve"],
  },
  {
    rank: "Eight",
    keywords: ["motion", "practice", "threshold"],
    reversedKeywords: ["misdirected effort", "delay", "repetition"],
  },
  {
    rank: "Nine",
    keywords: ["ripening", "resilience", "intensity"],
    reversedKeywords: ["fatigue", "overload", "guardedness"],
  },
  {
    rank: "Ten",
    keywords: ["culmination", "burden", "completion"],
    reversedKeywords: ["release", "collapse", "unfinished weight"],
  },
  {
    rank: "Page",
    keywords: ["message", "student energy", "curiosity"],
    reversedKeywords: ["immaturity", "mixed signal", "hesitation"],
  },
  {
    rank: "Knight",
    keywords: ["pursuit", "movement", "devotion"],
    reversedKeywords: ["recklessness", "stalling", "misapplied drive"],
  },
  {
    rank: "Queen",
    keywords: ["mastery", "care", "inner authority"],
    reversedKeywords: ["overextension", "insecurity", "closed channel"],
  },
  {
    rank: "King",
    keywords: ["leadership", "command", "maturity"],
    reversedKeywords: ["domination", "distance", "unsteady rule"],
  },
];

const titleCase = (value: string): string =>
  value.slice(0, 1).toUpperCase() + value.slice(1);

const minorArcana = (Object.keys(suitProfiles) as Suit[]).flatMap((suit) => {
  const suitProfile = suitProfiles[suit];

  return rankProfiles.map<Card>((rankProfile) => ({
    name: `${rankProfile.rank} of ${titleCase(suit)}`,
    arcana: "minor",
    suit,
    rank: rankProfile.rank,
    keywords: [
      ...rankProfile.keywords,
      suitProfile.theme,
      ...suitProfile.keywords,
    ],
    reversedKeywords: [
      ...rankProfile.reversedKeywords,
      ...suitProfile.reversedKeywords,
    ],
  }));
});

export const deck: readonly Card[] = [...majorArcana, ...minorArcana];
