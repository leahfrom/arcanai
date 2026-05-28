#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import { App } from "./App.js";
import { getVersion, helpText, parseCliOptions } from "./cli-options.js";
import { runDirect } from "./run-direct.js";

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

  const shouldUseInteractive =
    options.interactive &&
    process.stdin.isTTY &&
    process.stdout.isTTY &&
    !options.json;

  if (!shouldUseInteractive) {
    await runDirect(options);
    return;
  }

  const instance = render(
    <App
      initialQuestion={options.question}
      initialSpread={options.spread}
      provider={options.provider}
      model={options.model}
      allowReversed={options.allowReversed}
    />,
  );

  await instance.waitUntilExit();
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
