import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';

type TextInputProperties = {
  readonly label: string;
  readonly placeholder: string;
  readonly onSubmit: (value: string) => void;
};

export const TextInput = ({label, placeholder, onSubmit}: TextInputProperties) => {
  const [value, setValue] = useState('');

  useInput((input, key) => {
    if (key.return) {
      onSubmit(value.trim());
      return;
    }

    if (key.backspace || key.delete) {
      setValue(previous => previous.slice(0, -1));
      return;
    }

    if (key.ctrl || key.meta || key.escape || key.tab) {
      return;
    }

    if (input) {
      setValue(previous => `${previous}${input}`);
    }
  });

  return (
    <Box flexDirection="column">
      <Text color="cyan">{label}</Text>
      <Text>
        <Text color="gray">{'> '}</Text>
        {value.length > 0 ? value : <Text color="gray">{placeholder}</Text>}
      </Text>
      <Text color="gray">Press Enter to continue.</Text>
    </Box>
  );
};
