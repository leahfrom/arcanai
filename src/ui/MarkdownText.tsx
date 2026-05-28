import React from "react";
import { Box, Text } from "ink";
import { colors, tarotMarks } from "./theme.js";

type InlineToken = {
  readonly text: string;
  readonly kind: "plain" | "bold" | "italic" | "code";
};

type MarkdownTextProperties = {
  readonly children: string;
};

export const MarkdownText = ({ children }: MarkdownTextProperties) => {
  const lines = children.replaceAll("\r\n", "\n").split("\n");
  const nodes: React.ReactNode[] = [];
  let previousWasBlank = false;

  lines.forEach((rawLine, index) => {
    const line = rawLine.trimEnd();

    if (line.trim().length === 0) {
      if (!previousWasBlank && nodes.length > 0) {
        nodes.push(<Text key={`space:${index}`}> </Text>);
      }

      previousWasBlank = true;
      return;
    }

    previousWasBlank = false;

    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      nodes.push(
        <Text key={`heading:${index}`} color={colors.accent} bold>
          {tarotMarks.divider} {stripWrappingBold(heading[1])}
        </Text>,
      );
      return;
    }

    const boldHeading = line.trim().match(/^\*\*(.+)\*\*$/);
    if (boldHeading) {
      nodes.push(
        <Text key={`bold-heading:${index}`} color={colors.accent} bold>
          {tarotMarks.divider} {boldHeading[1]}
        </Text>,
      );
      return;
    }

    const listItem = line.match(/^(\s*)[-*+]\s+(.+)$/);
    if (listItem) {
      nodes.push(
        <Box
          key={`list:${index}`}
          paddingLeft={Math.floor(listItem[1].length / 2)}
        >
          <Text color={colors.alternate}>- </Text>
          <Text>{renderInline(listItem[2], index)}</Text>
        </Box>,
      );
      return;
    }

    nodes.push(
      <Text key={`paragraph:${index}`}>{renderInline(line, index)}</Text>,
    );
  });

  return <Box flexDirection="column">{nodes}</Box>;
};

const stripWrappingBold = (value: string) => {
  const match = value.match(/^\*\*(.+)\*\*$/);
  return match ? match[1] : value;
};

const renderInline = (value: string, lineIndex: number) =>
  parseInline(value).map((token, tokenIndex) => {
    const key = `inline:${lineIndex}:${tokenIndex}`;

    if (token.kind === "bold") {
      return (
        <Text key={key} bold>
          {token.text}
        </Text>
      );
    }

    if (token.kind === "italic") {
      return (
        <Text key={key} italic>
          {token.text}
        </Text>
      );
    }

    if (token.kind === "code") {
      return (
        <Text key={key} color={colors.accent}>
          {token.text}
        </Text>
      );
    }

    return token.text;
  });

const parseInline = (value: string): InlineToken[] => {
  const tokens: InlineToken[] = [];
  let remaining = value;

  while (remaining.length > 0) {
    const nextMatch = findNextInlineMatch(remaining);

    if (!nextMatch) {
      tokens.push({ kind: "plain", text: remaining });
      break;
    }

    if (nextMatch.index > 0) {
      tokens.push({ kind: "plain", text: remaining.slice(0, nextMatch.index) });
    }

    tokens.push({
      kind: nextMatch.kind,
      text: nextMatch.text,
    });

    remaining = remaining.slice(nextMatch.index + nextMatch.length);
  }

  return tokens;
};

type InlineMatch = {
  readonly index: number;
  readonly length: number;
  readonly text: string;
  readonly kind: Exclude<InlineToken["kind"], "plain">;
};

const findNextInlineMatch = (value: string): InlineMatch | undefined => {
  const patterns: ReadonlyArray<{
    readonly kind: InlineMatch["kind"];
    readonly regex: RegExp;
  }> = [
    { kind: "code", regex: /`([^`]+)`/ },
    { kind: "bold", regex: /\*\*([^*]+)\*\*/ },
    { kind: "italic", regex: /(?<!\*)\*([^*]+)\*(?!\*)/ },
  ];

  return patterns
    .map(({ kind, regex }) => {
      const match = regex.exec(value);

      if (!match || match.index < 0) {
        return undefined;
      }

      return {
        kind,
        index: match.index,
        length: match[0].length,
        text: match[1],
      };
    })
    .filter((match): match is InlineMatch => match !== undefined)
    .sort((left, right) => left.index - right.index)[0];
};
