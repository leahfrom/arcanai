import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getConfigPath,
  loadAiConfig,
  readUserConfig,
  redactUserConfig,
  setUserConfigValue,
} from "./config.js";

const testEnv = () => {
  const directory = mkdtempSync(join(tmpdir(), "arcanai-config-"));

  return {
    ARCANAI_CONFIG: join(directory, "config.json"),
  };
};

describe("config", () => {
  it("loads defaults without a user config", () => {
    const env = testEnv();

    expect(loadAiConfig({ env })).toEqual({
      provider: "auto",
      openai: {
        apiKey: undefined,
        baseUrl: undefined,
        model: "gpt-5.5",
      },
      ollama: {
        baseUrl: "http://127.0.0.1:11434/api",
        model: "llama3.2",
      },
    });
  });

  it("uses cli provider over env and file config", () => {
    const env = {
      ...testEnv(),
      ARCANAI_PROVIDER: "ollama",
      OPENAI_API_KEY: "env-key",
      OPENAI_MODEL: "env-model",
    };

    setUserConfigValue("provider", "openai", env);
    setUserConfigValue("openai.apiKey", "file-key", env);
    setUserConfigValue("openai.model", "file-model", env);

    expect(loadAiConfig({ env, provider: "none" })).toMatchObject({
      provider: "none",
      openai: {
        apiKey: "env-key",
        model: "env-model",
      },
    });
  });

  it("writes and redacts api keys", () => {
    const env = testEnv();

    setUserConfigValue("openai.apiKey", "sk-test", env);
    setUserConfigValue("ollama.model", "mistral", env);

    expect(readUserConfig(env)).toEqual({
      openai: {
        apiKey: "sk-test",
      },
      ollama: {
        model: "mistral",
      },
    });
    expect(redactUserConfig(readUserConfig(env))).toEqual({
      openai: {
        apiKey: "********",
      },
      ollama: {
        model: "mistral",
      },
    });
    expect(readFileSync(getConfigPath(env), "utf8")).toContain("sk-test");
  });
});
