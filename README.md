# arcanai

A TypeScript terminal tarot CLI for drawing cards, exploring spreads, and optionally asking an LLM to interpret the reading.

`arcanai` is built with Ink for an interactive terminal UI, but it also works well in scripts with one-shot and JSON output modes.

## Features

- Interactive terminal readings with `scry` or `arcanai`
- Single-card, three-card, and five-card cross spreads
- Optional reversed cards
- OpenAI, Mistral, and Ollama provider support through the AI SDK
- Local symbolic fallback when no AI provider is configured
- Built-in reading boundaries for consent, agency, and practical care
- Machine-readable JSON output for scripts and experiments

## Requirements

- Node.js 24 or newer
- Git, for installing directly from GitHub
- Optional: an OpenAI API key for OpenAI readings
- Optional: a Mistral API key for Mistral readings
- Optional: a running Ollama server for local model readings

## Install

```sh
npm install -g https://github.com/leahfrom/arcanai/releases/latest/download/arcanai.tgz
```

To install a specific version, use that release's tarball:

```sh
npm install -g https://github.com/leahfrom/arcanai/releases/download/v1.0.1/arcanai.tgz
```

Or download the release asset with GitHub CLI:

```sh
gh release download v1.0.1 --repo leahfrom/arcanai --pattern "arcanai.tgz"
npm install -g ./arcanai.tgz
```

The package installs two equivalent command names:

```sh
scry
arcanai
```

## Usage

Start the interactive UI:

```sh
scry
```

Type a question and press Enter to begin a three-card reading. Press Tab before
submitting to cycle through the single-card and five-card cross spreads. The
deck shuffles briefly, then reveals each drawn card before the interpretation
begins.

Run a one-shot reading:

```sh
scry --no-interactive --question "What needs my attention this week?" --spread three
```

Print JSON:

```sh
scry --no-interactive --json --provider none
```

Draw upright cards only:

```sh
scry --no-reversed
```

When a newer release is available, `arcanai` may print a short update notice
after a successful interactive or plain-text run. The notice is written to
stderr, skipped for JSON output and non-interactive pipes, and cached so it does
not check on every invocation.

```sh
npm install -g https://github.com/leahfrom/arcanai/releases/latest/download/arcanai.tgz
```

Disable update notices for one run:

```sh
scry --no-update-check
```

## Reading Boundaries

`arcanai` treats tarot as reflective symbolism, not certain prediction. Readings
should keep agency and consent at the center, speak in possibilities rather than
fixed fate, and end with a small practical next step.

The app avoids medical, legal, financial, death, pregnancy, curse, or guaranteed
outcome claims. It also avoids presenting another person's private thoughts or
feelings as fact; those questions are reframed toward your choices, boundaries,
and next right action.

## AI Providers

By default, `arcanai` uses `--provider auto`:

- If `OPENAI_API_KEY` is set, it tries OpenAI first.
- If `MISTRAL_API_KEY` is set, it tries Mistral with Medium 3.5 by default.
- It then tries Ollama at `OLLAMA_HOST` or `http://127.0.0.1:11434/api`.
- If no provider responds, it prints a local symbolic fallback reading.

You can configure provider defaults once instead of prefixing every command with
environment variables:

```sh
scry config set openai.apiKey sk-...
scry config set openai.model gpt-5.5
scry config set mistral.apiKey ...
scry config set mistral.model mistral-medium-3.5
scry config set ollama.model llama3.2
scry config set updateCheck false
```

Config is stored at `${XDG_CONFIG_HOME:-~/.config}/arcanai/config.json`, or at
`ARCANAI_CONFIG` when that environment variable is set. `scry config show`
redacts secrets by default; use `scry config path` to print the active path.

Config values use this precedence:

```text
CLI flags > environment variables > config file > defaults
```

If update checks are disabled in config, `scry --update-check` enables them for
one run. `ARCANAI_NO_UPDATE_CHECK=1` also disables them.

Provider examples:

```sh
scry --provider openai --model gpt-5.5
scry --provider mistral --model mistral-medium-3.5
scry --provider ollama --model llama3.2
scry --provider none
```

Useful environment variables:

```sh
ARCANAI_CONFIG=~/.config/arcanai/config.json
ARCANAI_PROVIDER=auto
ARCANAI_NO_UPDATE_CHECK=1
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.5
OPENAI_BASE_URL=https://api.openai.com/v1
MISTRAL_API_KEY=...
MISTRAL_MODEL=mistral-medium-3.5
MISTRAL_BASE_URL=https://api.mistral.ai/v1
OLLAMA_HOST=http://127.0.0.1:11434/api
ARCANAI_OLLAMA_MODEL=llama3.2
```

Useful config keys:

```text
provider
updateCheck
openai.apiKey
openai.baseUrl
openai.model
mistral.apiKey
mistral.baseUrl
mistral.model
ollama.baseUrl
ollama.model
```

## CLI Options

```text
-q, --question <text>      Question or theme for the reading
-s, --spread <spread>      single, three, cross (default: three)
-p, --provider <provider>  auto, openai, mistral, ollama, none (default: auto)
-m, --model <model>        Override provider model
    --no-reversed          Draw upright cards only
    --json                 Print machine-readable output
    --no-interactive       Skip the Ink UI
    --update-check         Allow post-run update notices for this run
    --no-update-check      Skip post-run update notices for this run
-h, --help                 Show help
-v, --version              Show version
```

## Development

```sh
npm install
npm run dev
npm test
npm run build
```

Run the CLI from source:

```sh
npm run dev -- --no-interactive --question "What should I look at next?"
```

## License

MIT
