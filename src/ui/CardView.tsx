import React from 'react';
import {Box, Text} from 'ink';
import type {DrawnCard} from '../tarot/types.js';
import {wrap} from '../format.js';

type CardViewProperties = {
  readonly card: DrawnCard;
  readonly width?: number;
};

export const CardView = ({card, width = 30}: CardViewProperties) => {
  const keywords = card.reversed ? card.reversedKeywords : card.keywords;
  const orientation = card.reversed ? 'reversed' : 'upright';

  return (
    <Box borderStyle="round" borderColor={card.reversed ? 'yellow' : 'cyan'} paddingX={1} width={width} flexDirection="column">
      <Text color="gray">{card.position}</Text>
      <Text bold>{card.name}</Text>
      <Text color={card.reversed ? 'yellow' : 'green'}>{orientation}</Text>
      {wrap(keywords.slice(0, 4).join(', '), Math.max(12, width - 4)).map(line => (
        <Text key={line} color="gray">{line}</Text>
      ))}
    </Box>
  );
};
