#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import { App } from "./App.js";
import { getVersion, helpText, parseCliOptions } from "./cli-options.js";
import {
  getConfigPath,
  loadAiConfig,
  readUserConfig,
  redactUserConfig,
  setUserConfigValue,
  unsetUserConfigValue,
} from "./config.js";
import { runDirect } from "./run-direct.js";
import type { CliOptions } from "./cli-options.js";

const runConfigCommand = (options: CliOptions): void => {
  const command = options.configCommand;

  if (!command) {
    return;
  }

  if (command.action === "path") {
    console.log(getConfigPath());
    return;
  }

  if (command.action === "show") {
    const config = readUserConfig();

    console.log(JSON.stringify(redactUserConfig(config), null, 2));
    return;
  }

  if (command.action === "set") {
    setUserConfigValue(command.key, command.value ?? "");
    console.log(`Set ${command.key} in ${getConfigPath()}`);
    return;
  }

  if (command.action === "unset") {
    unsetUserConfigValue(command.key);
    console.log(`Unset ${command.key} in ${getConfigPath()}`);
  }
};

const main = async (): Promise<void> => {
  const options = parseCliOptions(process.argv.slice(2));

  if (options.help) {
    console.log(helpText);
    return;
  }

  if (options.version) {
    console.log(getVersion());
    return;
  }

  if (options.configCommand) {
    runConfigCommand(options);
    return;
  }

  const aiConfig = loadAiConfig({ provider: options.provider });
  const provider = aiConfig.provider;

  const shouldUseInteractive =
    options.interactive &&
    process.stdin.isTTY &&
    process.stdout.isTTY &&
    !options.json;

  if (!shouldUseInteractive) {
    await runDirect({ ...options, provider, aiConfig });
    return;
  }

  const instance = render(
    <App
      initialQuestion={options.question}
      initialSpread={options.spread}
      provider={provider}
      model={options.model}
      aiConfig={aiConfig}
      allowReversed={options.allowReversed}
    />,
  );

  await instance.waitUntilExit();
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
