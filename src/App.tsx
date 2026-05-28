import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Newline, Text, useApp } from "ink";
import { readWithAi } from "./ai/providers.js";
import type { ProviderId, ReadingResponse } from "./ai/types.js";
import type { AiConfig } from "./config.js";
import { drawCards } from "./tarot/draw.js";
import { getSpread, spreads } from "./tarot/spreads.js";
import type { DrawnCard, Spread, SpreadId } from "./tarot/types.js";
import { CardBackView, CardView } from "./ui/CardView.js";
import { LoadingText } from "./ui/LoadingText.js";
import { MarkdownText } from "./ui/MarkdownText.js";
import { TextInput } from "./ui/TextInput.js";
import { colors } from "./ui/theme.js";

type Phase = "question" | "reading";
type DrawStage =
  | "waiting"
  | "shuffling"
  | "dealing"
  | "revealing"
  | "consulting";

const SHUFFLE_DELAY_MS = 2600;
const CARD_DEAL_DELAY_MS = 560;
const REVEAL_PAUSE_DELAY_MS = 900;
const CARD_REVEAL_DELAY_MS = 850;
const READING_SETTLE_DELAY_MS = 700;

type AppProperties = {
  readonly initialQuestion?: string;
  readonly initialSpread?: SpreadId;
  readonly provider: ProviderId;
  readonly model?: string;
  readonly aiConfig: AiConfig;
  readonly allowReversed: boolean;
};

export const App = ({
  initialQuestion = "",
  initialSpread,
  provider,
  model,
  aiConfig,
  allowReversed,
}: AppProperties) => {
  const { exit } = useApp();
  const [phase, setPhase] = useState<Phase>(
    initialQuestion ? "reading" : "question",
  );
  const [question, setQuestion] = useState(initialQuestion);
  const [spreadId, setSpreadId] = useState<SpreadId>(initialSpread ?? "three");
  const [selectedCards, setSelectedCards] = useState<readonly DrawnCard[]>([]);
  const [placedCount, setPlacedCount] = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);
  const [drawStage, setDrawStage] = useState<DrawStage>("waiting");
  const [reading, setReading] = useState<ReadingResponse | undefined>();
  const [error, setError] = useState<string | undefined>();
  const hasStartedDraw = useRef(false);
  const spread = useMemo(() => getSpread(spreadId), [spreadId]);
  const spreadCycle = useMemo<readonly SpreadId[]>(
    () => [
      "three",
      ...spreads
        .map((spreadOption) => spreadOption.id)
        .filter((id) => id !== "three"),
    ],
    [],
  );

  const cycleSpread = () => {
    setSpreadId((current) => {
      const currentIndex = spreadCycle.indexOf(current);
      const nextIndex = currentIndex === -1 ? 0 : currentIndex + 1;

      return spreadCycle[nextIndex % spreadCycle.length]!;
    });
  };

  useEffect(() => {
    if (phase !== "reading" || hasStartedDraw.current) {
      return;
    }

    hasStartedDraw.current = true;
    let isMounted = true;
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    const drawnCards = drawCards({ spread: spreadId, allowReversed });
    const schedule = (callback: () => void, delay: number) => {
      const timer = setTimeout(() => {
        if (isMounted) {
          callback();
        }
      }, delay);
      timers.push(timer);
    };

    setDrawStage("shuffling");
    schedule(() => {
      setSelectedCards(drawnCards);
      setDrawStage("dealing");

      drawnCards.forEach((_card, index) => {
        schedule(() => {
          setPlacedCount(index + 1);
        }, (index + 1) * CARD_DEAL_DELAY_MS);
      });

      schedule(
        () => {
          setDrawStage("revealing");

          drawnCards.forEach((_card, index) => {
            schedule(() => {
              setRevealedCount(index + 1);

              if (index === drawnCards.length - 1) {
                schedule(() => {
                  setDrawStage("consulting");
                }, READING_SETTLE_DELAY_MS);
              }
            }, (index + 1) * CARD_REVEAL_DELAY_MS);
          });
        },
        drawnCards.length * CARD_DEAL_DELAY_MS + REVEAL_PAUSE_DELAY_MS,
      );
    }, SHUFFLE_DELAY_MS);

    return () => {
      isMounted = false;
      timers.forEach((timer) => {
        clearTimeout(timer);
      });
    };
  }, [allowReversed, phase, spreadId]);

  useEffect(() => {
    if (
      phase !== "reading" ||
      drawStage !== "consulting" ||
      selectedCards.length !== spread.positions.length ||
      revealedCount !== spread.positions.length ||
      reading ||
      error
    ) {
      return;
    }

    let isMounted = true;
    readWithAi(
      provider,
      { question, spread, cards: selectedCards, model },
      aiConfig,
    )
      .then((response) => {
        if (isMounted) {
          setReading(response);
        }
      })
      .catch((caught) => {
        if (isMounted) {
          setError(
            caught instanceof Error ? caught.message : "The reading failed.",
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, [
    drawStage,
    aiConfig,
    error,
    model,
    phase,
    provider,
    question,
    reading,
    revealedCount,
    selectedCards,
    spread,
  ]);

  useEffect(() => {
    if (reading || error) {
      const timer = setTimeout(() => {
        exit();
      }, 250);

      return () => {
        clearTimeout(timer);
      };
    }

    return undefined;
  }, [error, exit, reading]);

  if (phase === "question") {
    return (
      <Frame eyebrow="question">
        <TextInput
          label="Ask your question"
          placeholder="Press Enter for a general reading"
          hint="Enter starts the reading. Tab changes spread."
          onAlternate={cycleSpread}
          onSubmit={(value) => {
            setQuestion(value);
            setPhase("reading");
          }}
        >
          <SpreadPreview spread={spread} />
        </TextInput>
      </Frame>
    );
  }

  return (
    <Frame eyebrow="reading">
      <Box flexDirection="column" marginBottom={1}>
        <Text color={colors.text} bold>
          {spread.label}
        </Text>
        <Text color={colors.muted}>{question || "General reading"}</Text>
      </Box>
      <Box gap={1} flexWrap="wrap" marginY={1}>
        {spread.positions.slice(0, placedCount).map((position, index) => {
          const card = selectedCards[index];

          if (card && index < revealedCount) {
            return <CardView key={`${card.position}:${card.name}`} card={card} />;
          }

          return <CardBackView key={position} position={position} />;
        })}
      </Box>
      {!reading && !error && (
        <Box>
          <LoadingText
            placedCount={placedCount}
            revealedCount={revealedCount}
            mode={
              drawStage === "dealing" || drawStage === "revealing"
                ? drawStage
                : drawStage === "consulting"
                  ? "consulting"
                  : "shuffling"
            }
            nextPosition={
              spread.positions[
                drawStage === "revealing" ? revealedCount : placedCount
              ]
            }
            totalCount={spread.positions.length}
          />
        </Box>
      )}
      {error && (
        <Box>
          <Text color={colors.danger}>{error}</Text>
        </Box>
      )}
      {reading && (
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor={colors.accent}
          paddingX={1}
          paddingY={1}
        >
          <Text color={colors.muted}>
            Provider: {reading.provider}
            {reading.model ? ` / ${reading.model}` : ""}
            {reading.usedFallback ? " / fallback" : ""}
          </Text>
          <Newline />
          <MarkdownText>{reading.text}</MarkdownText>
        </Box>
      )}
    </Frame>
  );
};

const Frame = ({
  children,
  eyebrow,
}: {
  readonly children: React.ReactNode;
  readonly eyebrow: string;
}) => (
  <Box flexDirection="column" paddingX={1} paddingY={1}>
    <Box flexDirection="column" marginBottom={1}>
      <Text>
        <Text color={colors.accent}>* </Text>
        <Text color={colors.text} bold>
          ARCANAI
        </Text>
        <Text color={colors.muted}> {eyebrow}</Text>
      </Text>
    </Box>
    {children}
  </Box>
);

const SpreadPreview = ({ spread }: { readonly spread: Spread }) => {
  const cardCount = spread.positions.length;
  const cardLabel = cardCount === 1 ? "card" : "cards";

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text>
        <Text color={colors.muted}>Spread </Text>
        <Text color={colors.accent} bold>
          {spread.label}
        </Text>
        <Text color={colors.muted}>
          {" "}
          / {cardCount} {cardLabel}
        </Text>
      </Text>
      <Text color={colors.muted}>{spread.description}</Text>
    </Box>
  );
};
