import { readWithAi } from "./ai/providers.js";
import { formatCard } from "./format.js";
import type { CliOptions } from "./cli-options.js";
import type { AiConfig } from "./config.js";
import { tarotBoundaryNote } from "./tarot/ethics.js";
import { drawCards } from "./tarot/draw.js";
import { getSpread } from "./tarot/spreads.js";

type DirectOptions = Omit<CliOptions, "configCommand" | "provider"> & {
  provider: NonNullable<CliOptions["provider"]>;
  aiConfig: AiConfig;
};

export const runDirect = async (options: DirectOptions): Promise<void> => {
  const spread = getSpread(options.spread);
  const cards = drawCards({
    spread: options.spread,
    allowReversed: options.allowReversed,
  });
  const reading = await readWithAi(
    options.provider,
    {
      question: options.question,
      spread,
      cards,
      model: options.model,
    },
    options.aiConfig,
  );

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          question: options.question,
          spread,
          cards,
          reading,
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(`arcanai / ${spread.label}`);
  console.log(
    options.question
      ? `Question: ${options.question}`
      : "Question: General reading",
  );
  console.log(`Guide: ${tarotBoundaryNote}`);
  console.log("");
  for (const card of cards) {
    console.log(formatCard(card));
  }

  console.log("");
  console.log(
    `Reading via ${reading.provider}${reading.model ? ` / ${reading.model}` : ""}${reading.usedFallback ? " / fallback" : ""}`,
  );
  console.log("");
  console.log(reading.text);
};
