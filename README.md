# arcanai

A TypeScript terminal tarot CLI for drawing cards, exploring spreads, and optionally asking an LLM to interpret the reading.

`arcanai` is built with Ink for an interactive terminal UI, but it also works well in scripts with one-shot and JSON output modes.

## Features

- Interactive terminal readings with `scry` or `arcanai`
- Single-card, three-card, and five-card cross spreads
- Optional reversed cards
- OpenAI and Ollama provider support through the AI SDK
- Local symbolic fallback when no AI provider is configured
- Machine-readable JSON output for scripts and experiments

## Requirements

- Node.js 20 or newer
- Optional: an `OPENAI_API_KEY` for OpenAI readings
- Optional: a running Ollama server for local model readings

## Install

```sh
npm install -g arcanai
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

## AI Providers

By default, `arcanai` uses `--provider auto`:

- If `OPENAI_API_KEY` is set, it tries OpenAI first.
- It then tries Ollama at `OLLAMA_HOST` or `http://127.0.0.1:11434/api`.
- If no provider responds, it prints a local symbolic fallback reading.

Provider examples:

```sh
OPENAI_API_KEY=... scry --provider openai --model gpt-5.5
scry --provider ollama --model llama3.2
scry --provider none
```

Useful environment variables:

```sh
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.5
OLLAMA_HOST=http://127.0.0.1:11434/api
ARCANAI_OLLAMA_MODEL=llama3.2
```

## CLI Options

```text
-q, --question <text>      Question or theme for the reading
-s, --spread <spread>      single, three, cross (default: three)
-p, --provider <provider>  auto, openai, ollama, none (default: auto)
-m, --model <model>        Override provider model
    --no-reversed          Draw upright cards only
    --json                 Print machine-readable output
    --no-interactive       Skip the Ink UI
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
