import React from "react";
import { Box, Text } from "ink";
import { colors, tarotMarks } from "./theme.js";

type InlineToken = {
  text: string;
  kind: "plain" | "bold" | "italic" | "code";
};

type MarkdownTextProps = {
  children: string;
};

type MarkdownBlock =
  | {
      type: "blank";
    }
  | {
      type: "heading";
      text: string;
    }
  | {
      type: "listItem";
      indent: number;
      marker: string;
      text: string;
    }
  | {
      type: "paragraph";
      text: string;
    };

export const parseMarkdownBlocks = (value: string): MarkdownBlock[] => {
  const lines = value.replaceAll("\r\n", "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let previousWasBlank = false;

  lines.forEach((rawLine) => {
    const line = rawLine.trimEnd();

    if (line.trim().length === 0) {
      if (!previousWasBlank && blocks.length > 0) {
        blocks.push({ type: "blank" });
      }

      previousWasBlank = true;
      return;
    }

    previousWasBlank = false;

    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      blocks.push({ type: "heading", text: stripWrappingBold(heading[1]!) });
      return;
    }

    const boldHeading = line.trim().match(/^\*\*(.+)\*\*$/);
    if (boldHeading) {
      blocks.push({ type: "heading", text: boldHeading[1]! });
      return;
    }

    const listItem = line.match(/^(\s*)(?:([-*+])|(\d+[.)]))\s+(.+)$/);
    if (listItem) {
      blocks.push({
        type: "listItem",
        indent: Math.floor(listItem[1]!.length / 2),
        marker: listItem[3] ?? "-",
        text: listItem[4]!.trim(),
      });
      return;
    }

    const previousBlock = blocks[blocks.length - 1];
    if (previousBlock?.type === "listItem" && /^\s+\S/.test(line)) {
      blocks[blocks.length - 1] = {
        ...previousBlock,
        text: `${previousBlock.text} ${line.trim()}`,
      };
      return;
    }

    blocks.push({ type: "paragraph", text: line });
  });

  return blocks;
};

export const MarkdownText = ({ children }: MarkdownTextProps) => {
  const blocks = parseMarkdownBlocks(children);
  const nodes: React.ReactNode[] = [];

  blocks.forEach((block, index) => {
    if (block.type === "blank") {
      nodes.push(<Text key={`space:${index}`}> </Text>);
      return;
    }

    if (block.type === "heading") {
      nodes.push(
        <Text key={`heading:${index}`} color={colors.accent} bold>
          {tarotMarks.divider} {block.text}
        </Text>,
      );
      return;
    }

    if (block.type === "listItem") {
      nodes.push(
        <Box key={`list:${index}`} paddingLeft={block.indent}>
          <Text color={colors.alternate}>{block.marker} </Text>
          <Box flexShrink={1}>
            <Text>{renderInline(block.text, index)}</Text>
          </Box>
        </Box>,
      );
      return;
    }

    nodes.push(
      <Text key={`paragraph:${index}`}>{renderInline(block.text, index)}</Text>,
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
  index: number;
  length: number;
  text: string;
  kind: Exclude<InlineToken["kind"], "plain">;
};

const findNextInlineMatch = (value: string): InlineMatch | undefined => {
  const patterns: {
    kind: InlineMatch["kind"];
    regex: RegExp;
  }[] = [
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
