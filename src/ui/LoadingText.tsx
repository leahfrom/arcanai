import React, {useEffect, useState} from 'react';
import {Text} from 'ink';
import {colors} from './theme.js';

type LoadingTextProperties = {
  readonly mode: 'consulting' | 'shuffling';
};

const frames = ['-', '\\', '|', '/'];

const messages: Record<LoadingTextProperties['mode'], readonly string[]> = {
  shuffling: [
    'The deck is finding its order',
    'A quiet hand cuts the cards',
    'The spread is taking shape'
  ],
  consulting: [
    'The candle gutters, then steadies',
    'The cards are listening between words',
    'A small omen rises from the spread',
    'The thread of the reading is being drawn',
    'The symbols are settling into place'
  ]
};

export const LoadingText = ({mode}: LoadingTextProperties) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [spinnerIndex, setSpinnerIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSpinnerIndex(previous => previous + 1);
    }, 120);

    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    setMessageIndex(0);

    const timer = setInterval(() => {
      setMessageIndex(previous => previous + 1);
    }, 3200);

    return () => {
      clearInterval(timer);
    };
  }, [mode]);

  const message = messages[mode][messageIndex % messages[mode].length]!;
  const frame = frames[spinnerIndex % frames.length]!;

  return (
    <Text>
      <Text color={colors.accent}>{frame} </Text>
      <Text color={colors.muted}>{message}</Text>
    </Text>
  );
};
