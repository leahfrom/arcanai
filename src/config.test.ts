import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getConfigPath,
  loadAiConfig,
  loadUpdateCheckConfig,
  readUserConfig,
  redactUserConfig,
  setUserConfigValue,
  unsetUserConfigValue,
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

  it("loads update check settings from cli, env, and config", () => {
    const env = testEnv();

    expect(loadUpdateCheckConfig({ env })).toEqual({ updateCheck: true });

    setUserConfigValue("updateCheck", "false", env);

    expect(readUserConfig(env)).toMatchObject({ updateCheck: false });
    expect(loadUpdateCheckConfig({ env })).toEqual({ updateCheck: false });
    expect(loadUpdateCheckConfig({ env, updateCheck: true })).toEqual({
      updateCheck: true,
    });
    expect(
      loadUpdateCheckConfig({
        env: { ...env, ARCANAI_NO_UPDATE_CHECK: "1" },
      }),
    ).toEqual({ updateCheck: false });

    unsetUserConfigValue("updateCheck", env);

    expect(readUserConfig(env)).toEqual({});
  });

  it("accepts common boolean values for updateCheck", () => {
    const env = testEnv();

    setUserConfigValue("updateCheck", "off", env);
    expect(readUserConfig(env)).toMatchObject({ updateCheck: false });

    setUserConfigValue("updateCheck", "yes", env);
    expect(readUserConfig(env)).toMatchObject({ updateCheck: true });
  });
});
