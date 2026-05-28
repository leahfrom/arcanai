import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';

type MenuItem<T extends string> = {
  readonly value: T;
  readonly label: string;
  readonly hint: string;
};

type MenuProperties<T extends string> = {
  readonly title: string;
  readonly items: readonly MenuItem<T>[];
  readonly onSubmit: (value: T) => void;
};

export const Menu = <T extends string>({title, items, onSubmit}: MenuProperties<T>) => {
  const [index, setIndex] = useState(0);

  useInput((_input, key) => {
    if (key.upArrow) {
      setIndex(previous => (previous === 0 ? items.length - 1 : previous - 1));
      return;
    }

    if (key.downArrow) {
      setIndex(previous => (previous === items.length - 1 ? 0 : previous + 1));
      return;
    }

    if (key.return) {
      onSubmit(items[index]!.value);
    }
  });

  return (
    <Box flexDirection="column">
      <Text color="cyan">{title}</Text>
      {items.map((item, itemIndex) => (
        <Text key={item.value} color={itemIndex === index ? 'magenta' : undefined}>
          {itemIndex === index ? '> ' : '  '}
          <Text bold={itemIndex === index}>{item.label}</Text>
          <Text color="gray"> - {item.hint}</Text>
        </Text>
      ))}
      <Text color="gray">Use arrow keys, then Enter.</Text>
    </Box>
  );
};
