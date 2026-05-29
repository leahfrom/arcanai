import { describe, expect, it } from "vitest";
import { parseMarkdownBlocks } from "./MarkdownText.js";

describe("parseMarkdownBlocks", () => {
  it("keeps indented continuation lines with their list item", () => {
    expect(
      parseMarkdownBlocks(
        [
          "- **Root:** Death (upright) - This card signals a threshold.",
          "  It points toward release and renewal.",
          "- **Present:** Four of Wands (upright) - This card signals support.",
        ].join("\n"),
      ),
    ).toEqual([
      {
        type: "listItem",
        indent: 0,
        marker: "-",
        text: "**Root:** Death (upright) - This card signals a threshold. It points toward release and renewal.",
      },
      {
        type: "listItem",
        indent: 0,
        marker: "-",
        text: "**Present:** Four of Wands (upright) - This card signals support.",
      },
    ]);
  });

  it("recognizes numbered list items without treating them as paragraphs", () => {
    expect(parseMarkdownBlocks("1. Core message\n2. Next step")).toEqual([
      {
        type: "listItem",
        indent: 0,
        marker: "1.",
        text: "Core message",
      },
      {
        type: "listItem",
        indent: 0,
        marker: "2.",
        text: "Next step",
      },
    ]);
  });
});
