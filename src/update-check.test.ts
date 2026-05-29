import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  checkForUpdate,
  compareVersions,
  formatUpdateNotice,
  maybePrintUpdateNotice,
} from "./update-check.js";

const cachePath = (): string =>
  join(mkdtempSync(join(tmpdir(), "arcanai-update-")), "cache.json");

const releaseFetch = ({
  ok = true,
  tagName = "v1.2.0",
  htmlUrl = "https://github.com/leahfrom/arcanai/releases/tag/v1.2.0",
}: {
  ok?: boolean;
  tagName?: string;
  htmlUrl?: string;
} = {}) =>
  vi.fn(
    async (
      _url: string,
      _init?: { headers?: Record<string, string>; signal?: AbortSignal },
    ) => ({
      ok,
      json: async () => ({
        tag_name: tagName,
        html_url: htmlUrl,
      }),
    }),
  );

describe("compareVersions", () => {
  it("compares plain and v-prefixed semver versions", () => {
    expect(compareVersions("1.2.0", "1.1.9")).toBeGreaterThan(0);
    expect(compareVersions("v1.0.0", "1.0.0")).toBe(0);
    expect(compareVersions("1.0.0", "1.0.1")).toBeLessThan(0);
  });
});

describe("checkForUpdate", () => {
  it("returns a notice when the latest release is newer", async () => {
    const path = cachePath();

    const notice = await checkForUpdate({
      currentVersion: "1.1.0",
      fetchImpl: releaseFetch(),
      cachePath: path,
      now: () => 1000,
    });

    expect(notice).toMatchObject({
      currentVersion: "1.1.0",
      latestVersion: "1.2.0",
      releaseUrl: "https://github.com/leahfrom/arcanai/releases/tag/v1.2.0",
    });
    expect(notice?.updateCommand).toBe(
      "npm install -g https://github.com/leahfrom/arcanai/releases/latest/download/arcanai.tgz",
    );
    expect(JSON.parse(readFileSync(path, "utf8"))).toMatchObject({
      checkedAt: 1000,
      latestVersion: "1.2.0",
    });
  });

  it("reuses fresh cache entries without fetching", async () => {
    const path = cachePath();
    writeFileSync(
      path,
      JSON.stringify({
        checkedAt: 1000,
        latestVersion: "1.2.0",
        releaseUrl: "https://example.test/release",
      }),
    );
    const fetchImpl = releaseFetch({ tagName: "v1.3.0" });

    const notice = await checkForUpdate({
      currentVersion: "1.1.0",
      fetchImpl,
      cachePath: path,
      now: () => 2000,
    });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(notice).toMatchObject({
      latestVersion: "1.2.0",
      releaseUrl: "https://example.test/release",
    });
  });

  it("stays quiet when the cached version is current", async () => {
    const path = cachePath();
    writeFileSync(
      path,
      JSON.stringify({
        checkedAt: 1000,
        latestVersion: "1.1.0",
      }),
    );

    await expect(
      checkForUpdate({
        currentVersion: "1.1.0",
        fetchImpl: releaseFetch({ tagName: "v1.2.0" }),
        cachePath: path,
        now: () => 2000,
      }),
    ).resolves.toBeUndefined();
  });
});

describe("maybePrintUpdateNotice", () => {
  it("prints a concise notice to stderr", async () => {
    const write = vi.fn();

    await maybePrintUpdateNotice({
      currentVersion: "1.1.0",
      fetchImpl: releaseFetch(),
      cachePath: cachePath(),
      stdout: { isTTY: true },
      stderr: { isTTY: true, write },
    });

    expect(write).toHaveBeenCalledWith(
      expect.stringContaining("Update available: arcanai 1.1.0 -> 1.2.0"),
    );
    expect(write).toHaveBeenCalledWith(
      expect.stringContaining(
        "Run: npm install -g https://github.com/leahfrom/arcanai/releases/latest/download/arcanai.tgz",
      ),
    );
  });

  it("does not print in JSON mode", async () => {
    const write = vi.fn();
    const fetchImpl = releaseFetch();

    await maybePrintUpdateNotice({
      currentVersion: "1.1.0",
      fetchImpl,
      cachePath: cachePath(),
      stdout: { isTTY: true },
      stderr: { isTTY: true, write },
      json: true,
    });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });

  it("does not print when stdout is not a TTY", async () => {
    const write = vi.fn();
    const fetchImpl = releaseFetch();

    await maybePrintUpdateNotice({
      currentVersion: "1.1.0",
      fetchImpl,
      cachePath: cachePath(),
      stdout: { isTTY: false },
      stderr: { isTTY: true, write },
    });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });
});

describe("formatUpdateNotice", () => {
  it("keeps the update command visible", () => {
    expect(
      formatUpdateNotice({
        currentVersion: "1.1.0",
        latestVersion: "1.2.0",
        releaseUrl: "https://example.test/release",
        updateCommand: "npm install -g arcanai",
      }),
    ).toContain("Run: npm install -g arcanai");
  });
});
