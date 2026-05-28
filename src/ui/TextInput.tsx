import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { colors, tarotMarks } from "./theme.js";

type TextInputProperties = {
  readonly label: string;
  readonly placeholder: string;
  readonly hint: string;
  readonly children?: React.ReactNode;
  readonly onAlternate?: () => void;
  readonly onSubmit: (value: string) => void;
};

export const TextInput = ({
  children,
  hint,
  label,
  onAlternate,
  placeholder,
  onSubmit,
}: TextInputProperties) => {
  const [value, setValue] = useState("");

  useInput((input, key) => {
    const returnIndex = input.search(/[\r\n]/);

    if (key.return || returnIndex !== -1) {
      const submittedInput =
        returnIndex === -1 ? "" : input.slice(0, returnIndex);

      onSubmit(`${value}${submittedInput}`.trim());
      return;
    }

    if (key.tab || input === "\t") {
      onAlternate?.();
      return;
    }

    if (key.backspace || key.delete) {
      setValue((previous) => previous.slice(0, -1));
      return;
    }

    if (key.ctrl || key.meta || key.escape || key.tab) {
      return;
    }

    if (input) {
      setValue((previous) => `${previous}${input}`);
    }
  });

  return (
    <Box flexDirection="column">
      <Text>
        <Text color={colors.text} bold>
          {label}
        </Text>
      </Text>
      <Box marginTop={1}>
        <Text>
          <Text color={colors.accent}>{tarotMarks.prompt} </Text>
          {value.length > 0 ? (
            <Text color={colors.text}>{value}</Text>
          ) : (
            <Text color={colors.muted}>{placeholder}</Text>
          )}
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text color={colors.muted}>{hint}</Text>
      </Box>
      {children}
    </Box>
  );
};
