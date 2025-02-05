#!/usr/bin/env node
import { createValidator } from "@typeonly/validator";
import { readFileSync } from "node:fs";
import { basename, dirname } from "node:path";
import { type RtoModules, generateRtoModules } from "typeonly";

import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

process.on("uncaughtException", (err) => {
  console.error("uncaughtException", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.trace("unhandledRejection", err);
  process.exit(1);
});

class InvalidArgumentError extends Error {
  readonly causeCode = "invalidArgument";
}

type OptionDefinition = commandLineUsage.OptionDefinition & commandLineArgs.OptionDefinition;

const optionDefinitions: OptionDefinition[] = [
  {
    name: "help",
    alias: "h",
    type: Boolean,
    description: "Print this help message.",
  },
  {
    name: "source",
    alias: "s",
    description: "The typing file (one file allowed).",
    type: String,
    multiple: false,
    typeLabel: "{underline file.d.ts}",
  },
  {
    name: "source-encoding",
    type: String,
    description: "Encoding for typing files (default is {underline utf8}).",
  },
  {
    name: "source-dir",
    type: String,
    description: "The source directory that contains typing files (optional).",
    typeLabel: "{underline directory}",
  },
  {
    name: "rto-module",
    description: "The rto.json file to process (one file allowed).",
    type: String,
    multiple: false,
    typeLabel: "{underline file.rto.json}",
  },
  {
    name: "rto-dir",
    type: String,
    description: "The source directory for rto.json file (optional).",
    typeLabel: "{underline directory}",
  },
  {
    name: "type",
    alias: "t",
    type: String,
    description: "The type name of the root element in JSON.",
  },
  {
    name: "non-strict",
    type: Boolean,
    description: "Enable non-strict mode (accept extra properties).",
  },
  {
    name: "json-encoding",
    alias: "e",
    type: String,
    description: "Encoding for JSON file to validate (default is {underline utf8}).",
  },
  {
    name: "json",
    description: "The JSON file to validate (by default at last position, one file allowed).",
    type: String,
    multiple: false,
    defaultOption: true,
    typeLabel: "{underline file.json}",
  },
];

cli().catch((error) => {
  console.error(`Error: ${error.message}`);
});

async function cli() {
  const options = parseOptions();
  if (!options) {
    printHelp();
    return;
  }

  if (options.help) {
    printHelp();
    return;
  }

  try {
    await processFile(options);
  } catch (error: any) {
    if (error.causeCode === "invalidArgument") {
      console.error(`Error: ${error.message}`);
      printHelp();
    } else throw error;
  }
}

function printHelp() {
  const sections = [
    {
      header: "TypeOnly Validator CLI",
      content: "A CLI to validate JSON files conformity with typing.",
    },
    {
      header: "Synopsis",
      content: [
        "$ npx @typeonly/validator-cli {bold -s} {underline src/file-name.d.ts} {bold -t} {underline RootTypeName} {underline dir/data.json}",
        "$ npx @typeonly/validator-cli {bold --help}",
      ],
    },
    {
      header: "Options",
      optionList: optionDefinitions,
    },
    {
      content: "Project home: {underline https://github.com/paroi-tech/typeonly}",
    },
  ];
  const usage = commandLineUsage(sections);
  console.log(usage);
}

interface OptionsObject {
  [name: string]: unknown;
}

function parseOptions(): OptionsObject | undefined {
  try {
    return commandLineArgs(optionDefinitions);
  } catch (error: any) {
    console.log(`Error: ${error.message}`);
    printHelp();
  }
}

async function processFile(options: OptionsObject) {
  if (!options.source && !options["rto-module"])
    throw new InvalidArgumentError("Missing typing file or rto.json file.");
  if (options.source && options["rto-module"])
    throw new InvalidArgumentError("You must provide a typing file or a rto.json file not both.");
  if (!options.json) throw new InvalidArgumentError("Missing input JSON file to validate.");

  if (options.source) await validateFromTypingFile(options);
  else await validateFromRtoFile(options);
}

async function validateFromRtoFile(options: OptionsObject) {
  const moduleFile = options["rto-module"] as string;
  const bnad = baseNameAndDir(moduleFile);
  const baseDir = normalizeDir((options["rto-dir"] as string | undefined) ?? bnad.directory);
  const typeName = options.type as string;
  const data = readJsonFileSync(options);

  let modulePath = normalizeModulePath(moduleFile, baseDir);
  if (modulePath.endsWith(".rto.json")) modulePath = modulePath.slice(0, -9);

  const validator = await createValidator({
    modulePaths: [modulePath],
    baseDir,
    acceptAdditionalProperties: !!options["non-strict"],
  });

  const result = validator.validate(typeName, data, modulePath);

  if (!result.valid) {
    console.error(result.error);
    process.exit(1);
  }
}

async function validateFromTypingFile(options: OptionsObject) {
  let typingFile = options.source as string;
  const bnad = baseNameAndDir(typingFile);
  const sourceDir = normalizeDir((options["source-dir"] as string | undefined) ?? bnad.directory);

  if (typingFile.startsWith(sourceDir)) typingFile = typingFile.substring(sourceDir.length + 1);

  const typeName = options.type as string;

  const jsonData = readJsonFileSync(options);

  let sourceModulePath = normalizeModulePath(typingFile, sourceDir);
  if (!sourceModulePath.endsWith(".ts"))
    throw new InvalidArgumentError("Parameter 'source' must end with '.d.ts' or '.ts'");
  sourceModulePath = sourceModulePath.substring(
    0,
    sourceModulePath.length - (sourceModulePath.endsWith(".d.ts") ? 5 : 3),
  );

  const encoding = (options["source-encoding"] ?? undefined) as string | undefined;
  validateBufferEncoding(encoding);

  const bundle = (await generateRtoModules({
    modulePaths: [sourceModulePath],
    readFiles: {
      sourceDir,
      encoding,
    },
    returnRtoModules: true,
  })) as RtoModules;

  const validator = createValidator({
    bundle,
    acceptAdditionalProperties: !!options["non-strict"],
  });

  const result = validator.validate(typeName, jsonData, sourceModulePath);

  if (!result.valid) {
    console.error(result.error);
    process.exit(1);
  }
}

function readJsonFileSync(options: OptionsObject): unknown {
  const fileToValidate = options.json as string;
  const encoding = (options["json-encoding"] as string | undefined) ?? "utf8";
  validateBufferEncoding(encoding);
  try {
    const data = readFileSync(fileToValidate, encoding);
    return JSON.parse(data);
  } catch (err) {
    throw new InvalidArgumentError(`Cannot read file: ${fileToValidate}`);
  }
}

function normalizeModulePath(file: string, sourceDir: string): string {
  const prefix = `${sourceDir}/`.replace(/\\/g, "/");
  let f = file.replace(/\\/g, "/");
  if (f.startsWith(prefix)) f = `./${f.substr(prefix.length)}`;
  else if (!f.startsWith("./") && !f.startsWith("../")) f = `./${f}`;
  return f;
}

function normalizeDir(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+$/, "");
}

interface BaseNameAndDir {
  directory: string;
  fileName: string;
}

function baseNameAndDir(file: string): BaseNameAndDir {
  return {
    directory: dirname(file),
    fileName: basename(file),
  };
}

const bufferEncodingValues = new Set([
  "ascii",
  "utf8",
  "utf-8",
  "utf16le",
  "ucs2",
  "ucs-2",
  "base64",
  "base64url",
  "latin1",
  "binary",
  "hex",
]);
function validateBufferEncoding(s: string | undefined): asserts s is BufferEncoding | undefined {
  if (!s) return;
  if (!bufferEncodingValues.has(s)) throw new Error(`Invalid encoding value '${s}'`);
}
