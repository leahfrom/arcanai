import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { colors, tarotMarks } from "./theme.js";

type LoadingTextProps = {
  mode: "consulting" | "dealing" | "revealing" | "shuffling";
  nextPosition?: string;
  placedCount?: number;
  revealedCount?: number;
  totalCount?: number;
};

const frames = ["<*  >", "< * >", "<  *>", "< * >"];
const deckFrames = ["[.:. ]", "[.*. ]", "[.**.]", "[ .*.]", "[ .:.]"];

const messageIntervals: Record<LoadingTextProps["mode"], number> = {
  shuffling: 850,
  dealing: 1200,
  revealing: 1400,
  consulting: 3200,
};

const messages: Record<LoadingTextProps["mode"], string[]> = {
  shuffling: [
    "Stirring the deck under lamplight",
    "Loosening yesterday from the cards",
    "A little static gathers in the velvet",
  ],
  dealing: [
    "Laying a small map in the dark",
    "Setting each threshold with care",
    "The spread is finding its shape",
  ],
  revealing: [
    "Lifting the veil from the next card",
    "A symbol steps into the candlelight",
    "Letting the picture surface slowly",
  ],
  consulting: [
    "The candlelight leans toward the symbols",
    "The cards offer weather, not law",
    "Agency stays with you while the story gathers",
    "A gentle pattern rises from the spread",
    "The symbols settle into their little constellation",
  ],
};

export const LoadingText = ({
  mode,
  nextPosition,
  placedCount = 0,
  revealedCount = 0,
  totalCount = 0,
}: LoadingTextProps) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [spinnerIndex, setSpinnerIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSpinnerIndex((previous) => previous + 1);
    }, 120);

    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    setMessageIndex(0);

    const timer = setInterval(() => {
      setMessageIndex((previous) => previous + 1);
    }, messageIntervals[mode]);

    return () => {
      clearInterval(timer);
    };
  }, [mode]);

  const message = messages[mode][messageIndex % messages[mode].length]!;
  const frame = frames[spinnerIndex % frames.length]!;
  const deckFrame = deckFrames[spinnerIndex % deckFrames.length]!;
  const progress =
    totalCount > 0
      ? Array.from({ length: totalCount }, (_value, index) =>
          index < revealedCount
            ? tarotMarks.spark
            : index < placedCount
              ? tarotMarks.veil
              : ".",
        ).join(" ")
      : "";
  const activeMessage =
    mode === "dealing" && !nextPosition
      ? "Every card is veiled"
      : mode === "revealing" && !nextPosition
        ? "The full spread is awake"
        : message;
  const drawingLabel =
    mode === "dealing" && nextPosition
      ? ` ${placedCount + 1}/${totalCount}: ${nextPosition}`
      : mode === "revealing" && nextPosition
        ? ` ${revealedCount + 1}/${totalCount}: ${nextPosition}`
        : "";

  return (
    <Box flexDirection="column">
      <Text>
        <Text color={colors.accent}>
          {mode === "shuffling" ? deckFrame : frame}{" "}
        </Text>
        <Text color={colors.muted}>
          {activeMessage}
          {drawingLabel}
        </Text>
      </Text>
      {totalCount > 0 && mode !== "consulting" && (
        <Text color={colors.muted}>Constellation {progress}</Text>
      )}
    </Box>
  );
};
