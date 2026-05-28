import React, {useEffect, useMemo, useState} from 'react';
import {Box, Newline, Text, useApp} from 'ink';
import {readWithAi} from './ai/providers.js';
import type {ProviderId, ReadingResponse} from './ai/types.js';
import {drawCards} from './tarot/draw.js';
import {getSpread, spreads} from './tarot/spreads.js';
import type {DrawnCard, SpreadId} from './tarot/types.js';
import {CardView} from './ui/CardView.js';
import {LoadingText} from './ui/LoadingText.js';
import {MarkdownText} from './ui/MarkdownText.js';
import {Menu} from './ui/Menu.js';
import {TextInput} from './ui/TextInput.js';
import {colors} from './ui/theme.js';

type Phase = 'question' | 'spread' | 'reading';

type AppProperties = {
  readonly initialQuestion?: string;
  readonly initialSpread?: SpreadId;
  readonly provider: ProviderId;
  readonly model?: string;
  readonly allowReversed: boolean;
};

export const App = ({initialQuestion = '', initialSpread, provider, model, allowReversed}: AppProperties) => {
  const {exit} = useApp();
  const [phase, setPhase] = useState<Phase>(initialQuestion && initialSpread ? 'reading' : initialQuestion ? 'spread' : 'question');
  const [question, setQuestion] = useState(initialQuestion);
  const [spreadId, setSpreadId] = useState<SpreadId>(initialSpread ?? 'three');
  const [cards, setCards] = useState<readonly DrawnCard[]>([]);
  const [reading, setReading] = useState<ReadingResponse | undefined>();
  const [error, setError] = useState<string | undefined>();
  const spread = useMemo(() => getSpread(spreadId), [spreadId]);

  useEffect(() => {
    if (phase !== 'reading' || cards.length > 0) {
      return;
    }

    setCards(drawCards({spread: spreadId, allowReversed}));
  }, [allowReversed, cards.length, phase, spreadId]);

  useEffect(() => {
    if (phase !== 'reading' || cards.length === 0 || reading || error) {
      return;
    }

    let isMounted = true;
    readWithAi(provider, {question, spread, cards, model})
      .then(response => {
        if (isMounted) {
          setReading(response);
        }
      })
      .catch(caught => {
        if (isMounted) {
          setError(caught instanceof Error ? caught.message : 'The reading failed.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [cards, error, model, phase, provider, question, reading, spread]);

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

  if (phase === 'question') {
    return (
      <Frame eyebrow="question">
        <TextInput
          label="What are we scrying into?"
          placeholder="Ask a question, or press Enter for a general reading"
          onSubmit={value => {
            setQuestion(value);
            setPhase('spread');
          }}
        />
      </Frame>
    );
  }

  if (phase === 'spread') {
    return (
      <Frame eyebrow="spread">
        <Menu
          title="Choose a spread"
          items={spreads.map(spreadOption => ({
            value: spreadOption.id,
            label: spreadOption.label,
            hint: spreadOption.description
          }))}
          onSubmit={value => {
            setSpreadId(value);
            setPhase('reading');
          }}
        />
      </Frame>
    );
  }

  return (
    <Frame eyebrow="reading">
      <Box flexDirection="column" marginBottom={1}>
        <Text color={colors.text} bold>{spread.label}</Text>
        <Text color={colors.muted}>{question || 'General reading'}</Text>
      </Box>
      <Box gap={1} flexWrap="wrap" marginY={1}>
        {cards.map(card => (
          <CardView key={`${card.position}:${card.name}`} card={card} />
        ))}
      </Box>
      {!reading && !error && (
        <Box>
          <LoadingText mode={cards.length === 0 ? 'shuffling' : 'consulting'} />
        </Box>
      )}
      {error && (
        <Box>
          <Text color={colors.danger}>{error}</Text>
        </Box>
      )}
      {reading && (
        <Box flexDirection="column" borderStyle="round" borderColor={colors.accent} paddingX={1} paddingY={1}>
          <Text color={colors.muted}>Provider: {reading.provider}{reading.model ? ` / ${reading.model}` : ''}{reading.usedFallback ? ' / fallback' : ''}</Text>
          <Newline />
          <MarkdownText>{reading.text}</MarkdownText>
        </Box>
      )}
    </Frame>
  );
};

const Frame = ({children, eyebrow}: {readonly children: React.ReactNode; readonly eyebrow: string}) => (
  <Box flexDirection="column" paddingX={1} paddingY={1}>
    <Box flexDirection="column" marginBottom={1}>
      <Text>
        <Text color={colors.accent}>* </Text>
        <Text color={colors.text} bold>ARCANAI</Text>
        <Text color={colors.muted}> {eyebrow}</Text>
      </Text>
    </Box>
    {children}
  </Box>
);
