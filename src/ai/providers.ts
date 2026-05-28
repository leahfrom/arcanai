import {createFallbackReading} from './fallback.js';
import {buildReadingPrompt} from './prompt.js';
import type {AiProvider, ProviderId, ReadingRequest, ReadingResponse} from './types.js';

const timeoutSignal = (milliseconds: number): AbortSignal => AbortSignal.timeout(milliseconds);

const parseOpenAiText = (payload: unknown): string | undefined => {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const {output_text: outputText} = payload as {output_text?: unknown};
  if (typeof outputText === 'string') {
    return outputText;
  }

  const {output} = payload as {output?: unknown};
  if (!Array.isArray(output)) {
    return undefined;
  }

  return output
    .flatMap(item => {
      if (!item || typeof item !== 'object' || !Array.isArray((item as {content?: unknown}).content)) {
        return [];
      }

      return ((item as {content: unknown[]}).content).map(content => {
        if (!content || typeof content !== 'object') {
          return '';
        }

        const text = (content as {text?: unknown}).text;
        return typeof text === 'string' ? text : '';
      });
    })
    .filter(Boolean)
    .join('\n')
    .trim();
};

const openAiProvider: AiProvider = {
  id: 'openai',
  label: 'OpenAI',
  isAvailable: () => Boolean(process.env.OPENAI_API_KEY),
  async read(request: ReadingRequest): Promise<ReadingResponse> {
    const model = request.model ?? process.env.OPENAI_MODEL ?? 'gpt-4.1-mini';
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model,
        input: buildReadingPrompt(request),
        temperature: 0.8
      }),
      signal: timeoutSignal(45_000)
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed: ${response.status} ${response.statusText}`);
    }

    const text = parseOpenAiText(await response.json());

    if (!text) {
      throw new Error('OpenAI response did not include text.');
    }

    return {
      provider: 'openai',
      model,
      text
    };
  }
};

const ollamaProvider: AiProvider = {
  id: 'ollama',
  label: 'Ollama',
  isAvailable: () => true,
  async read(request: ReadingRequest): Promise<ReadingResponse> {
    const host = process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434';
    const model = request.model ?? process.env.ARCANAI_OLLAMA_MODEL ?? 'llama3.2';
    const response = await fetch(`${host.replace(/\/$/, '')}/api/generate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model,
        prompt: buildReadingPrompt(request),
        stream: false,
        options: {
          temperature: 0.8
        }
      }),
      signal: timeoutSignal(60_000)
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
    }

    const payload = await response.json() as {response?: unknown};
    if (typeof payload.response !== 'string' || payload.response.trim().length === 0) {
      throw new Error('Ollama response did not include text.');
    }

    return {
      provider: 'ollama',
      model,
      text: payload.response.trim()
    };
  }
};

export const providers = {
  openai: openAiProvider,
  ollama: ollamaProvider
} as const;

export const readWithAi = async (
  providerId: ProviderId,
  request: ReadingRequest
): Promise<ReadingResponse> => {
  if (providerId === 'none') {
    return createFallbackReading(request);
  }

  const candidates: readonly AiProvider[] = providerId === 'auto'
    ? [openAiProvider, ollamaProvider]
    : [providers[providerId]];

  for (const provider of candidates) {
    if (!provider.isAvailable()) {
      continue;
    }

    try {
      return await provider.read(request);
    } catch {
      continue;
    }
  }

  return createFallbackReading(request);
};
