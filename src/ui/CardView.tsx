import React from "react";
import { Box, Text } from "ink";
import type { DrawnCard } from "../tarot/types.js";
import { wrap } from "../format.js";
import { colors, tarotMarks } from "./theme.js";

type CardViewProps = {
  card: DrawnCard;
  width?: number;
};

type CardBackViewProps = {
  position: string;
  width?: number;
};

export const CardView = ({ card, width = 26 }: CardViewProps) => {
  const keywords = card.reversed ? card.reversedKeywords : card.keywords;
  const orientation = card.reversed ? "reversed" : "upright";
  const borderColor = card.reversed ? colors.alternate : colors.accent;
  const accent = card.reversed ? colors.alternate : colors.success;
  const marker = card.reversed ? tarotMarks.reversed : tarotMarks.upright;

  return (
    <Box
      borderStyle="round"
      borderColor={borderColor}
      paddingX={1}
      width={width}
      flexDirection="column"
    >
      <Text color={colors.muted}>
        {tarotMarks.divider} {card.position}
      </Text>
      <Text>
        <Text color={borderColor}>{marker} </Text>
        <Text bold color={colors.text}>
          {card.name}
        </Text>
      </Text>
      <Text color={accent}>{orientation}</Text>
      {wrap(keywords.slice(0, 4).join(", "), Math.max(12, width - 4)).map(
        (line) => (
          <Text key={line} color={colors.muted}>
            {line}
          </Text>
        ),
      )}
    </Box>
  );
};

export const CardBackView = ({
  position,
  width = 26,
}: CardBackViewProps) => (
  <Box
    borderStyle="round"
    borderColor={colors.cool}
    paddingX={1}
    width={width}
    flexDirection="column"
  >
    <Text color={colors.muted}>
      {tarotMarks.veil} {position}
    </Text>
    <Text color={colors.alternate}> . * . * . * . </Text>
    <Text color={colors.accent}>   A R C A N A I  </Text>
    <Text color={colors.cool}> * . * . * . * </Text>
    <Text color={colors.muted}>veiled card</Text>
    <Text color={colors.muted}>awaiting its voice</Text>
  </Box>
);
