import { describe, expect, it } from "vitest";
import { parseCliOptions } from "./cli-options.js";

describe("parseCliOptions", () => {
  it("leaves update checks unset by default", () => {
    expect(parseCliOptions([])).toMatchObject({
      updateCheck: undefined,
    });
  });

  it("parses one-run update check flags", () => {
    expect(parseCliOptions(["--no-update-check"])).toMatchObject({
      updateCheck: false,
    });
    expect(parseCliOptions(["--update-check"])).toMatchObject({
      updateCheck: true,
    });
  });

  it("rejects conflicting update check flags", () => {
    expect(() => {
      parseCliOptions(["--update-check", "--no-update-check"]);
    }).toThrow("Use either --update-check or --no-update-check");
  });
});
