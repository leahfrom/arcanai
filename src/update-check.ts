import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const releaseApiUrl =
  "https://api.github.com/repos/leahfrom/arcanai/releases/latest";
const releasePageUrl = "https://github.com/leahfrom/arcanai/releases/latest";
const updateCommand =
  "npm install -g https://github.com/leahfrom/arcanai/releases/latest/download/arcanai.tgz";
const updateCheckIntervalMs = 24 * 60 * 60 * 1000;
const updateCheckTimeoutMs = 1200;

type VersionParts = {
  major: number;
  minor: number;
  patch: number;
};

type UpdateCache = {
  checkedAt: number;
  latestVersion?: string;
  releaseUrl?: string;
};

type FetchLike = (
  url: string,
  init?: {
    headers?: Record<string, string>;
    signal?: AbortSignal;
  },
) => Promise<{
  ok: boolean;
  json: () => Promise<unknown>;
}>;

type UpdateCheckOptions = {
  currentVersion: string;
  env?: NodeJS.ProcessEnv;
  fetchImpl?: FetchLike;
  now?: () => number;
  cachePath?: string;
};

export type UpdateNotice = {
  currentVersion: string;
  latestVersion: string;
  releaseUrl: string;
  updateCommand: string;
};

type PrintUpdateNoticeOptions = UpdateCheckOptions & {
  stdout?: {
    isTTY?: boolean;
  };
  stderr?: {
    isTTY?: boolean;
    write: (message: string) => unknown;
  };
  json?: boolean;
};

const nonEmpty = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
};

const parseVersion = (version: string): VersionParts | undefined => {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(version.trim());

  if (!match) {
    return undefined;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
};

export const compareVersions = (left: string, right: string): number => {
  const leftParts = parseVersion(left);
  const rightParts = parseVersion(right);

  if (!leftParts || !rightParts) {
    return 0;
  }

  for (const key of ["major", "minor", "patch"] as const) {
    const diff = leftParts[key] - rightParts[key];

    if (diff !== 0) {
      return diff;
    }
  }

  return 0;
};

export const getUpdateCachePath = (
  env: NodeJS.ProcessEnv = process.env,
): string => {
  const configHome =
    nonEmpty(env.XDG_CACHE_HOME) ?? join(homedir(), ".cache");

  return join(configHome, "arcanai", "update-check.json");
};

const parseCache = (cache: unknown): UpdateCache | undefined => {
  if (!cache || typeof cache !== "object") {
    return undefined;
  }

  const { checkedAt, latestVersion, releaseUrl } = cache as {
    checkedAt?: unknown;
    latestVersion?: unknown;
    releaseUrl?: unknown;
  };

  if (typeof checkedAt !== "number") {
    return undefined;
  }

  return {
    checkedAt,
    latestVersion:
      typeof latestVersion === "string" ? latestVersion : undefined,
    releaseUrl: typeof releaseUrl === "string" ? releaseUrl : undefined,
  };
};

const readCache = (path: string): UpdateCache | undefined => {
  if (!existsSync(path)) {
    return undefined;
  }

  try {
    return parseCache(JSON.parse(readFileSync(path, "utf8")));
  } catch {
    return undefined;
  }
};

const writeCache = (path: string, cache: UpdateCache): void => {
  try {
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    writeFileSync(path, `${JSON.stringify(cache, null, 2)}\n`, {
      mode: 0o600,
    });
  } catch {
    // Update checks should never interrupt a reading.
  }
};

const getNoticeFromVersion = (
  currentVersion: string,
  latestVersion: string | undefined,
  releaseUrl: string | undefined,
): UpdateNotice | undefined => {
  if (!latestVersion || compareVersions(latestVersion, currentVersion) <= 0) {
    return undefined;
  }

  return {
    currentVersion,
    latestVersion,
    releaseUrl: releaseUrl ?? releasePageUrl,
    updateCommand,
  };
};

const fetchLatestRelease = async (
  fetchImpl: FetchLike,
): Promise<{ latestVersion: string; releaseUrl?: string }> => {
  const response = await fetchImpl(releaseApiUrl, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "arcanai-update-check",
    },
    signal: AbortSignal.timeout(updateCheckTimeoutMs),
  });

  if (!response.ok) {
    throw new Error("Could not fetch latest arcanai release.");
  }

  const body = await response.json();

  if (!body || typeof body !== "object") {
    throw new Error("Invalid arcanai release response.");
  }

  const { tag_name: tagName, html_url: htmlUrl } = body as {
    tag_name?: unknown;
    html_url?: unknown;
  };

  if (typeof tagName !== "string") {
    throw new Error("Latest arcanai release did not include a tag.");
  }

  return {
    latestVersion: tagName.replace(/^v/i, ""),
    releaseUrl: typeof htmlUrl === "string" ? htmlUrl : undefined,
  };
};

const isFresh = (cache: UpdateCache, now: number): boolean =>
  now - cache.checkedAt >= 0 && now - cache.checkedAt < updateCheckIntervalMs;

const shouldSkipUpdateCheck = (
  env: NodeJS.ProcessEnv,
  json: boolean,
  stdout?: { isTTY?: boolean },
  stderr?: { isTTY?: boolean },
): boolean =>
  json ||
  stdout?.isTTY !== true ||
  stderr?.isTTY !== true ||
  nonEmpty(env.CI) !== undefined ||
  nonEmpty(env.ARCANAI_NO_UPDATE_CHECK) !== undefined ||
  nonEmpty(env.NO_UPDATE_NOTIFIER) !== undefined;

export const checkForUpdate = async ({
  currentVersion,
  env = process.env,
  fetchImpl = globalThis.fetch as FetchLike,
  now = Date.now,
  cachePath = getUpdateCachePath(env),
}: UpdateCheckOptions): Promise<UpdateNotice | undefined> => {
  const checkedAt = now();
  const cache = readCache(cachePath);

  if (cache && isFresh(cache, checkedAt)) {
    return getNoticeFromVersion(
      currentVersion,
      cache.latestVersion,
      cache.releaseUrl,
    );
  }

  try {
    const latest = await fetchLatestRelease(fetchImpl);
    const nextCache = { checkedAt, ...latest };

    writeCache(cachePath, nextCache);

    return getNoticeFromVersion(
      currentVersion,
      nextCache.latestVersion,
      nextCache.releaseUrl,
    );
  } catch {
    return getNoticeFromVersion(
      currentVersion,
      cache?.latestVersion,
      cache?.releaseUrl,
    );
  }
};

export const formatUpdateNotice = (notice: UpdateNotice): string =>
  [
    "",
    `Update available: arcanai ${notice.currentVersion} -> ${notice.latestVersion}`,
    `Run: ${notice.updateCommand}`,
    `Release: ${notice.releaseUrl}`,
    "",
  ].join("\n");

export const maybePrintUpdateNotice = async ({
  stdout = process.stdout,
  stderr = process.stderr,
  json = false,
  env = process.env,
  ...options
}: PrintUpdateNoticeOptions): Promise<void> => {
  if (shouldSkipUpdateCheck(env, json, stdout, stderr)) {
    return;
  }

  const notice = await checkForUpdate({ ...options, env });

  if (notice) {
    stderr.write(formatUpdateNotice(notice));
  }
};
