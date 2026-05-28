import {parseArgs} from 'node:util';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import type {ProviderId} from './ai/types.js';
import type {SpreadId} from './tarot/types.js';

export type CliOptions = {
  readonly help: boolean;
  readonly version: boolean;
  readonly json: boolean;
  readonly interactive: boolean;
  readonly question: string;
  readonly spread: SpreadId;
  readonly provider: ProviderId;
  readonly model?: string;
  readonly allowReversed: boolean;
};

const validSpreads = new Set<SpreadId>(['single', 'three', 'cross']);
const validProviders = new Set<ProviderId>(['auto', 'openai', 'ollama', 'none']);

export const helpText = `Arcanai

Draw tarot cards and ask an LLM to interpret the spread.

Usage
  scry [options]
  arcanai [options]

Options
  -q, --question <text>      Question or theme for the reading
  -s, --spread <spread>      single, three, cross (default: three)
  -p, --provider <provider>  auto, openai, ollama, none (default: auto)
  -m, --model <model>        Override provider model
      --no-reversed          Draw upright cards only
      --json                 Print machine-readable output
      --no-interactive       Skip the Ink UI
  -h, --help                 Show help
  -v, --version              Show version

Environment
  OPENAI_API_KEY             Enables the OpenAI provider
  OPENAI_MODEL               Default OpenAI model override
  OLLAMA_HOST                Ollama host, default http://127.0.0.1:11434
  ARCANAI_OLLAMA_MODEL       Default Ollama model override
`;

export const getVersion = (): string => {
  const directory = dirname(fileURLToPath(import.meta.url));
  const packageJson = JSON.parse(readFileSync(join(directory, '..', 'package.json'), 'utf8')) as {version?: unknown};

  return typeof packageJson.version === 'string' ? packageJson.version : '0.0.0';
};

export const parseCliOptions = (argv: readonly string[]): CliOptions => {
  const normalized = argv[0] === 'draw' ? argv.slice(1) : argv;
  const {values} = parseArgs({
    args: [...normalized],
    allowPositionals: true,
    options: {
      question: {type: 'string', short: 'q'},
      spread: {type: 'string', short: 's', default: 'three'},
      provider: {type: 'string', short: 'p', default: 'auto'},
      model: {type: 'string', short: 'm'},
      json: {type: 'boolean', default: false},
      interactive: {type: 'boolean', default: true},
      'no-interactive': {type: 'boolean', default: false},
      reversed: {type: 'boolean', default: true},
      'no-reversed': {type: 'boolean', default: false},
      help: {type: 'boolean', short: 'h', default: false},
      version: {type: 'boolean', short: 'v', default: false}
    }
  });

  const spread = values.spread;
  const provider = values.provider;

  if (typeof spread !== 'string' || !validSpreads.has(spread as SpreadId)) {
    throw new Error(`Invalid spread "${String(spread)}". Expected single, three, or cross.`);
  }

  if (typeof provider !== 'string' || !validProviders.has(provider as ProviderId)) {
    throw new Error(`Invalid provider "${String(provider)}". Expected auto, openai, ollama, or none.`);
  }

  return {
    help: Boolean(values.help),
    version: Boolean(values.version),
    json: Boolean(values.json),
    interactive: Boolean(values.interactive) && !values['no-interactive'],
    question: typeof values.question === 'string' ? values.question : '',
    spread: spread as SpreadId,
    provider: provider as ProviderId,
    model: typeof values.model === 'string' ? values.model : undefined,
    allowReversed: Boolean(values.reversed) && !values['no-reversed']
  };
};
