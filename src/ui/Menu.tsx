import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { colors, tarotMarks } from "./theme.js";

type MenuItem<T extends string> = {
  value: T;
  label: string;
  hint: string;
};

type MenuProps<T extends string> = {
  title: string;
  items: MenuItem<T>[];
  onSubmit: (value: T) => void;
};

export const Menu = <T extends string>({
  title,
  items,
  onSubmit,
}: MenuProps<T>) => {
  const [index, setIndex] = useState(0);

  useInput((_input, key) => {
    if (key.upArrow) {
      setIndex((previous) =>
        previous === 0 ? items.length - 1 : previous - 1,
      );
      return;
    }

    if (key.downArrow) {
      setIndex((previous) =>
        previous === items.length - 1 ? 0 : previous + 1,
      );
      return;
    }

    if (key.return) {
      onSubmit(items[index]!.value);
    }
  });

  return (
    <Box flexDirection="column">
      <Text>
        <Text color={colors.text} bold>
          {title}
        </Text>
      </Text>
      {items.map((item, itemIndex) => (
        <Box key={item.value} flexDirection="column" marginTop={1}>
          <Text>
            <Text color={itemIndex === index ? colors.accent : colors.muted}>
              {itemIndex === index ? tarotMarks.prompt : "  "}{" "}
            </Text>
            <Text
              bold={itemIndex === index}
              color={itemIndex === index ? colors.text : undefined}
            >
              {item.label}
            </Text>
          </Text>
          {itemIndex === index && (
            <Text color={colors.muted}> {item.hint}</Text>
          )}
        </Box>
      ))}
      <Box marginTop={1}>
        <Text color={colors.muted}>Use arrow keys, then Enter.</Text>
      </Box>
    </Box>
  );
};
