import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { z } from "zod";
import type { ProviderId } from "./ai/types.js";

const providerSchema = z.enum(["auto", "openai", "ollama", "none"]);
const configSchema = z
  .object({
    provider: providerSchema.optional(),
    openai: z
      .object({
        apiKey: z.string().min(1).optional(),
        baseUrl: z.string().min(1).optional(),
        model: z.string().min(1).optional(),
      })
      .optional(),
    ollama: z
      .object({
        baseUrl: z.string().min(1).optional(),
        model: z.string().min(1).optional(),
      })
      .optional(),
  })
  .strict();

export type UserConfig = z.infer<typeof configSchema>;

export type AiConfig = {
  readonly provider: ProviderId;
  readonly openai: {
    readonly apiKey?: string;
    readonly baseUrl?: string;
    readonly model: string;
  };
  readonly ollama: {
    readonly baseUrl: string;
    readonly model: string;
  };
};

export type ConfigKey =
  | "provider"
  | "openai.apiKey"
  | "openai.baseUrl"
  | "openai.model"
  | "ollama.baseUrl"
  | "ollama.model";

export const configKeys: readonly ConfigKey[] = [
  "provider",
  "openai.apiKey",
  "openai.baseUrl",
  "openai.model",
  "ollama.baseUrl",
  "ollama.model",
];

const defaultAiConfig = {
  provider: "auto",
  openai: {
    model: "gpt-5.5",
  },
  ollama: {
    baseUrl: "http://127.0.0.1:11434/api",
    model: "llama3.2",
  },
} as const satisfies AiConfig;

const nonEmpty = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
};

const parseProvider = (
  value: string | undefined,
  source: string,
): ProviderId | undefined => {
  const trimmed = nonEmpty(value);

  if (!trimmed) {
    return undefined;
  }

  const result = providerSchema.safeParse(trimmed);
  if (!result.success) {
    throw new Error(
      `Invalid ${source} "${trimmed}". Expected auto, openai, ollama, or none.`,
    );
  }

  return result.data;
};

const formatZodError = (error: z.ZodError): string =>
  error.issues
    .map((issue) => {
      const path = issue.path.join(".") || "config";

      return `${path}: ${issue.message}`;
    })
    .join("; ");

export const getConfigPath = (
  env: NodeJS.ProcessEnv = process.env,
): string => {
  const explicitPath = nonEmpty(env.ARCANAI_CONFIG);
  if (explicitPath) {
    return explicitPath;
  }

  const configHome = nonEmpty(env.XDG_CONFIG_HOME) ?? join(homedir(), ".config");

  return join(configHome, "arcanai", "config.json");
};

export const readUserConfig = (
  env: NodeJS.ProcessEnv = process.env,
): UserConfig => {
  const path = getConfigPath(env);

  if (!existsSync(path)) {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    throw new Error(`Could not read config at ${path}: ${message}`);
  }

  const result = configSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `Invalid config at ${path}: ${formatZodError(result.error)}`,
    );
  }

  return result.data;
};

export const loadAiConfig = ({
  env = process.env,
  provider,
}: {
  readonly env?: NodeJS.ProcessEnv;
  readonly provider?: ProviderId;
} = {}): AiConfig => {
  const userConfig = readUserConfig(env);

  return {
    provider:
      provider ??
      parseProvider(env.ARCANAI_PROVIDER, "ARCANAI_PROVIDER") ??
      userConfig.provider ??
      defaultAiConfig.provider,
    openai: {
      apiKey: nonEmpty(env.OPENAI_API_KEY) ?? userConfig.openai?.apiKey,
      baseUrl: nonEmpty(env.OPENAI_BASE_URL) ?? userConfig.openai?.baseUrl,
      model:
        nonEmpty(env.OPENAI_MODEL) ??
        userConfig.openai?.model ??
        defaultAiConfig.openai.model,
    },
    ollama: {
      baseUrl:
        nonEmpty(env.OLLAMA_HOST) ??
        userConfig.ollama?.baseUrl ??
        defaultAiConfig.ollama.baseUrl,
      model:
        nonEmpty(env.ARCANAI_OLLAMA_MODEL) ??
        userConfig.ollama?.model ??
        defaultAiConfig.ollama.model,
    },
  };
};

const cloneConfig = (config: UserConfig): UserConfig =>
  JSON.parse(JSON.stringify(config)) as UserConfig;

const pruneEmptySections = (config: UserConfig): UserConfig => {
  if (config.openai && Object.keys(config.openai).length === 0) {
    delete config.openai;
  }

  if (config.ollama && Object.keys(config.ollama).length === 0) {
    delete config.ollama;
  }

  return config;
};

export const writeUserConfig = (
  config: UserConfig,
  env: NodeJS.ProcessEnv = process.env,
): void => {
  const path = getConfigPath(env);
  const directory = dirname(path);

  mkdirSync(directory, { recursive: true, mode: 0o700 });
  writeFileSync(
    path,
    `${JSON.stringify(pruneEmptySections(config), null, 2)}\n`,
    {
      mode: 0o600,
    },
  );
  chmodSync(path, 0o600);
};

function assertConfigKey(key: string): asserts key is ConfigKey {
  if (!configKeys.includes(key as ConfigKey)) {
    throw new Error(
      `Invalid config key "${key}". Expected one of: ${configKeys.join(", ")}.`,
    );
  }
}

export const setUserConfigValue = (
  key: string,
  value: string,
  env: NodeJS.ProcessEnv = process.env,
): void => {
  assertConfigKey(key);

  const next = cloneConfig(readUserConfig(env));
  const normalizedValue = nonEmpty(value);

  if (!normalizedValue) {
    throw new Error(`Config value for "${key}" cannot be empty.`);
  }

  switch (key) {
    case "provider":
      next.provider = parseProvider(normalizedValue, "provider");
      break;
    case "openai.apiKey":
      next.openai = { ...next.openai, apiKey: normalizedValue };
      break;
    case "openai.baseUrl":
      next.openai = { ...next.openai, baseUrl: normalizedValue };
      break;
    case "openai.model":
      next.openai = { ...next.openai, model: normalizedValue };
      break;
    case "ollama.baseUrl":
      next.ollama = { ...next.ollama, baseUrl: normalizedValue };
      break;
    case "ollama.model":
      next.ollama = { ...next.ollama, model: normalizedValue };
      break;
  }

  writeUserConfig(next, env);
};

export const unsetUserConfigValue = (
  key: string,
  env: NodeJS.ProcessEnv = process.env,
): void => {
  assertConfigKey(key);

  const next = cloneConfig(readUserConfig(env));

  switch (key) {
    case "provider":
      delete next.provider;
      break;
    case "openai.apiKey":
      delete next.openai?.apiKey;
      break;
    case "openai.baseUrl":
      delete next.openai?.baseUrl;
      break;
    case "openai.model":
      delete next.openai?.model;
      break;
    case "ollama.baseUrl":
      delete next.ollama?.baseUrl;
      break;
    case "ollama.model":
      delete next.ollama?.model;
      break;
  }

  writeUserConfig(next, env);
};

export const redactUserConfig = (config: UserConfig): UserConfig => {
  const redacted = cloneConfig(config);

  if (redacted.openai?.apiKey) {
    redacted.openai.apiKey = "********";
  }

  return redacted;
};
