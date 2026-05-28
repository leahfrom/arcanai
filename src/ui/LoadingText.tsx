import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { colors } from "./theme.js";

type LoadingTextProperties = {
  readonly mode: "consulting" | "dealing" | "revealing" | "shuffling";
  readonly nextPosition?: string;
  readonly placedCount?: number;
  readonly revealedCount?: number;
  readonly totalCount?: number;
};

const frames = ["-", "\\", "|", "/"];
const deckFrames = ["[////]", "[\\\\\\\\]", "[||||]", "[----]"];

const messages: Record<LoadingTextProperties["mode"], readonly string[]> = {
  shuffling: ["Riffle shuffle", "Cutting the deck", "Squaring the edges"],
  dealing: [
    "Laying the cards face down",
    "Setting the positions",
    "Letting the spread take shape",
  ],
  revealing: [
    "Turning the cards",
    "Revealing the next position",
    "Letting the symbols surface",
  ],
  consulting: [
    "The candle gutters, then steadies",
    "The cards are listening between words",
    "A small omen rises from the spread",
    "The thread of the reading is being drawn",
    "The symbols are settling into place",
  ],
};

export const LoadingText = ({
  mode,
  nextPosition,
  placedCount = 0,
  revealedCount = 0,
  totalCount = 0,
}: LoadingTextProperties) => {
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
    }, 3200);

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
          index < revealedCount ? "*" : index < placedCount ? "-" : ".",
        ).join(" ")
      : "";
  const activeMessage =
    mode === "dealing" && !nextPosition
      ? "All cards are face down"
      : mode === "revealing" && !nextPosition
        ? "The full spread is on the table"
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
        <Text color={colors.muted}>Spread {progress}</Text>
      )}
    </Box>
  );
};
