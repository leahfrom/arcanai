import { parseArgs } from "node:util";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ProviderId } from "./ai/types.js";
import type { ConfigKey } from "./config.js";
import type { SpreadId } from "./tarot/types.js";

export type ConfigCommand =
  | {
      action: "show" | "path";
    }
  | {
      action: "set" | "unset";
      key: ConfigKey;
      value?: string;
    };

export type CliOptions = {
  help: boolean;
  version: boolean;
  json: boolean;
  interactive: boolean;
  question: string;
  spread: SpreadId;
  provider?: ProviderId;
  model?: string;
  allowReversed: boolean;
  updateCheck?: boolean;
  configCommand?: ConfigCommand;
};

const validSpreads = new Set<SpreadId>(["single", "three", "cross"]);
const validProviders = new Set<ProviderId>([
  "auto",
  "openai",
  "ollama",
  "none",
]);

export const helpText = `Arcanai

Draw tarot cards and ask an LLM to interpret the spread.

Usage
  scry [options]
  arcanai [options]
  scry config show
  scry config path
  scry config set <key> <value>
  scry config unset <key>

Options
  -q, --question <text>      Question or theme for the reading
  -s, --spread <spread>      single, three, cross (default: three)
  -p, --provider <provider>  auto, openai, ollama, none (default: auto)
  -m, --model <model>        Override provider model
      --no-reversed          Draw upright cards only
      --json                 Print machine-readable output
      --no-interactive       Skip the Ink UI
      --update-check         Allow post-run update notices for this run
      --no-update-check      Skip post-run update notices for this run
  -h, --help                 Show help
  -v, --version              Show version

Environment
  ARCANAI_CONFIG           Config path override
  ARCANAI_PROVIDER         Default provider: auto, openai, ollama, none
  ARCANAI_NO_UPDATE_CHECK  Disable the post-run update notice
  OPENAI_API_KEY             Enables the OpenAI provider
  OPENAI_MODEL               Default OpenAI model override
  OPENAI_BASE_URL            OpenAI-compatible API base URL
  OLLAMA_HOST                Ollama host, default http://127.0.0.1:11434
  ARCANAI_OLLAMA_MODEL       Default Ollama model override

Config keys
  provider
  updateCheck
  openai.apiKey
  openai.baseUrl
  openai.model
  ollama.baseUrl
  ollama.model
`;

export const getVersion = (): string => {
  const directory = dirname(fileURLToPath(import.meta.url));
  const packageJson = JSON.parse(
    readFileSync(join(directory, "..", "package.json"), "utf8"),
  ) as { version?: unknown };

  return typeof packageJson.version === "string"
    ? packageJson.version
    : "0.0.0";
};

export const parseCliOptions = (argv: string[]): CliOptions => {
  const normalized = argv[0] === "draw" ? argv.slice(1) : argv;

  if (normalized[0] === "config") {
    return parseConfigOptions(normalized.slice(1));
  }

  const { values } = parseArgs({
    args: [...normalized],
    allowPositionals: true,
    options: {
      question: { type: "string", short: "q" },
      spread: { type: "string", short: "s", default: "three" },
      provider: { type: "string", short: "p" },
      model: { type: "string", short: "m" },
      json: { type: "boolean", default: false },
      interactive: { type: "boolean", default: true },
      "no-interactive": { type: "boolean", default: false },
      reversed: { type: "boolean", default: true },
      "no-reversed": { type: "boolean", default: false },
      "update-check": { type: "boolean" },
      "no-update-check": { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
      version: { type: "boolean", short: "v", default: false },
    },
  });

  const spread = values.spread;
  const provider = values.provider;
  const updateCheck = values["update-check"];

  if (typeof spread !== "string" || !validSpreads.has(spread as SpreadId)) {
    throw new Error(
      `Invalid spread "${String(spread)}". Expected single, three, or cross.`,
    );
  }

  if (provider !== undefined && typeof provider !== "string") {
    throw new Error(
      `Invalid provider "${String(provider)}". Expected auto, openai, ollama, or none.`,
    );
  }

  if (
    typeof provider === "string" &&
    !validProviders.has(provider as ProviderId)
  ) {
    throw new Error(
      `Invalid provider "${String(provider)}". Expected auto, openai, ollama, or none.`,
    );
  }

  if (values["no-update-check"] && updateCheck) {
    throw new Error("Use either --update-check or --no-update-check, not both.");
  }

  return {
    help: Boolean(values.help),
    version: Boolean(values.version),
    json: Boolean(values.json),
    interactive: Boolean(values.interactive) && !values["no-interactive"],
    question: typeof values.question === "string" ? values.question : "",
    spread: spread as SpreadId,
    provider:
      typeof provider === "string" ? (provider as ProviderId) : undefined,
    model: typeof values.model === "string" ? values.model : undefined,
    allowReversed: Boolean(values.reversed) && !values["no-reversed"],
    updateCheck: values["no-update-check"]
      ? false
      : updateCheck
        ? true
        : undefined,
  };
};

const emptyCliOptions = ({
  configCommand,
  help = false,
  json = false,
}: {
  configCommand?: ConfigCommand;
  help?: boolean;
  json?: boolean;
}): CliOptions => ({
  help,
  version: false,
  json,
  interactive: false,
  question: "",
  spread: "three",
  provider: undefined,
  allowReversed: true,
  configCommand,
});

const parseConfigOptions = (argv: string[]): CliOptions => {
  const json = argv.includes("--json");
  const args = argv.filter((arg) => arg !== "--json");
  const action = args[0] ?? "show";

  if (action === "--help" || action === "-h" || action === "help") {
    return emptyCliOptions({ help: true });
  }

  if (action === "show" || action === "path") {
    return emptyCliOptions({ configCommand: { action }, json });
  }

  if (action === "set") {
    const key = args[1];
    const value = args.slice(2).join(" ");

    if (!key || !value) {
      throw new Error("Usage: scry config set <key> <value>");
    }

    return emptyCliOptions({
      configCommand: {
        action,
        key: key as ConfigKey,
        value,
      },
      json,
    });
  }

  if (action === "unset") {
    const key = args[1];

    if (!key) {
      throw new Error("Usage: scry config unset <key>");
    }

    return emptyCliOptions({
      configCommand: {
        action,
        key: key as ConfigKey,
      },
      json,
    });
  }

  throw new Error(
    `Invalid config command "${action}". Expected show, path, set, or unset.`,
  );
};
