#!/usr/bin/env node
import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, parse } from "node:path";
import { generateRtoModules, parseTypeOnly } from "./api.js";
import type { TypeOnlyAst } from "./ast.d.ts";
import { ensureDirectory } from "./rto-factory/ProjectInputOutput.js";
import type { RtoModules } from "./rto.d.ts";

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
    name: "output-dir",
    alias: "o",
    type: String,
    description: "The output directory (optional).",
    typeLabel: "{underline directory}",
  },
  {
    name: "source-dir",
    alias: "s",
    type: String,
    description:
      "The source directory (optional when used with option {underline --ast} or with a single source file).",
    typeLabel: "{underline directory}",
  },
  {
    name: "encoding",
    alias: "e",
    type: String,
    description: "Encoding for input and output file(s) (default is {underline utf8}).",
  },
  {
    name: "bundle",
    alias: "b",
    type: String,
    description: "Generate a bundle file for RTO data (optional).",
  },
  {
    name: "prettify",
    type: Boolean,
    description: "Prettify RTO files (optional).",
  },
  {
    name: "ast",
    type: Boolean,
    description: "Generate AST files instead of RTO files (optional).",
  },
  {
    name: "src",
    description: "Input files to process (by default at last position).",
    type: String,
    multiple: true,
    defaultOption: true,
    typeLabel: "{underline file} ...",
  },
];

cli().catch((error) => {
  console.error(`Error: ${error.message}`, error);
});

async function cli() {
  const options = parseOptions();
  if (!options) return;
  if (options.help) {
    printHelp();
    return;
  }

  try {
    await processFiles(options);
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
      header: "TypeOnly",
      content: "TypeOnly Parser.",
    },
    {
      header: "Synopsis",
      content: [
        "$ npx typeonly {bold --source-dir} {underline src/} {underline file-name.d.ts}",
        "$ npx typeonly {bold --help}",
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

async function processFiles(options: OptionsObject) {
  if (options.ast) {
    if (!options.src || !Array.isArray(options.src))
      throw new InvalidArgumentError("Missing source file(s).");
    options.src.map((file: string) => createAstJsonFile(file, options));
  } else await createRtoJsonFiles(options);
}

function createAstJsonFile(file: string, options: OptionsObject) {
  const f = options["source-dir"] ? join(options["source-dir"] as string, file) : file;
  const encoding: BufferEncoding = (options.encoding as BufferEncoding) ?? "utf8";
  let source: string;
  try {
    source = readFileSync(f, { encoding });
  } catch (err) {
    throw new InvalidArgumentError(`Cannot read file: ${f}`);
  }

  let fileName = basename(f);
  if (fileName.endsWith(".ts"))
    fileName = fileName.substring(0, fileName.length - (fileName.endsWith(".d.ts") ? 5 : 3));

  const ast: TypeOnlyAst = parseTypeOnly({ source });
  const outFile = join(
    (options["output-dir"] as string | undefined) ?? dirname(f),
    `${fileName}.ast.json`,
  );
  writeFileSync(outFile, JSON.stringify(ast, undefined, "\t"), encoding);
}

async function createRtoJsonFiles(options: OptionsObject) {
  let srcList = (options.src as string[] | undefined) ?? [];
  let sourceDir: string;
  if (!options["source-dir"]) {
    if (srcList.length === 1) sourceDir = dirname(srcList[0]);
    else throw new Error("Missing 'source-dir' option.");
  } else sourceDir = options["source-dir"] as string;
  sourceDir = normalizeDir(sourceDir);

  if (srcList.length === 0) srcList = getTypingFilesInDir(sourceDir);

  const modulePaths = normalizeModulePaths(srcList, sourceDir);
  const encoding: BufferEncoding = (options.encoding as BufferEncoding | undefined) ?? "utf8";
  const prettify = options.prettify ? "\t" : undefined;
  let bundleName = options.bundle as string | undefined;

  if (bundleName) {
    if (!bundleName.endsWith(".to.json")) bundleName += ".to.json";
    let outputDir = options["output-dir"]
      ? normalizeDir(options["output-dir"] as string)
      : undefined;
    const parsed = parse(bundleName);
    if (parsed.dir) {
      outputDir = outputDir ? join(outputDir, parsed.dir) : parsed.dir;
      bundleName = parsed.base;
    }
    if (outputDir) {
      await ensureDirectory(outputDir);
      bundleName = join(outputDir, bundleName);
    }
    const rtoModules = (await generateRtoModules({
      modulePaths,
      readFiles: {
        sourceDir,
        encoding,
      },
      returnRtoModules: true,
    })) as RtoModules;
    writeFileSync(bundleName, JSON.stringify(rtoModules, undefined, prettify), { encoding });
  } else {
    const outputDir = normalizeDir((options["output-dir"] as string | undefined) ?? sourceDir);
    await generateRtoModules({
      modulePaths,
      readFiles: {
        sourceDir,
        encoding,
      },
      writeFiles: {
        outputDir,
        prettify,
      },
    });
  }
}

function getTypingFilesInDir(dir: string): string[] {
  const files = readdirSync(dir);
  return files.filter((fileName) => fileName.endsWith(".d.ts"));
}

function normalizeModulePaths(files: string[], sourceDir: string): string[] {
  const prefix = `${sourceDir}/`.replace(/\\/g, "/");
  return files.map((file) => {
    let f = file.replace(/\\/g, "/");
    if (f.startsWith(prefix)) f = `./${f.substring(prefix.length)}`;
    else if (!f.startsWith("./") && !f.startsWith("../")) f = `./${f}`;
    return f;
  });
}

function normalizeDir(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+$/, "");
}
