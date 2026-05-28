import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { colors, tarotMarks } from "./theme.js";

type TextInputProperties = {
  readonly label: string;
  readonly placeholder: string;
  readonly onSubmit: (value: string) => void;
};

export const TextInput = ({
  label,
  placeholder,
  onSubmit,
}: TextInputProperties) => {
  const [value, setValue] = useState("");

  useInput((input, key) => {
    if (key.return) {
      onSubmit(value.trim());
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
        <Text color={colors.muted}>
          Enter continues. Empty question opens a general reading.
        </Text>
      </Box>
    </Box>
  );
};
