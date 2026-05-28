# arcanai

A TypeScript terminal tarot CLI. Draw cards, inspect the spread, and optionally ask an LLM to interpret the reading.

The package installs two command names:

```sh
scry
arcanai
```

## Install

```sh
npm install -g arcanai
```

## Use

Run the interactive Ink UI:

```sh
scry
```

Run a one-shot reading:

```sh
scry --no-interactive --question "What needs my attention this week?" --spread three
```

Print JSON for scripts:

```sh
scry --no-interactive --json --provider none
```

## AI providers

`arcanai` uses the AI SDK for provider calls and `--provider auto` by default.

- If `OPENAI_API_KEY` is set, it tries OpenAI first.
- It then tries Ollama at `OLLAMA_HOST` or `http://127.0.0.1:11434/api`.
- If no provider responds, it prints a local symbolic fallback reading.

Provider examples:

```sh
OPENAI_API_KEY=... scry --provider openai --model gpt-4.1-mini
scry --provider ollama --model llama3.2
scry --provider none
```

Useful environment variables:

```sh
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4.1-mini
OLLAMA_HOST=http://127.0.0.1:11434/api
ARCANAI_OLLAMA_MODEL=llama3.2
```

## Development

```sh
npm install
npm run dev
npm test
npm run build
```

## Publish checklist

```sh
npm run test
npm run build
npm pack --dry-run
npm publish
```
