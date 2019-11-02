#!/usr/bin/env node
import { createChecker } from "@typeonly/checker"
import commandLineArgs = require("command-line-args")
import commandLineUsage = require("command-line-usage")
import { readFileSync } from "fs"
import { basename, dirname } from "path"
import { generateRtoModules, RtoModules } from "typeonly"

process.on("uncaughtException", err => {
  console.error("uncaughtException", err)
  process.exit(1)
})

process.on("unhandledRejection", err => {
  console.trace("unhandledRejection", err)
  process.exit(1)
})

class InvalidArgumentError extends Error {
  readonly causeCode = "invalidArgument"
  constructor(message: string) {
    super(message)
  }
}

type OptionDefinition = commandLineUsage.OptionDefinition & commandLineArgs.OptionDefinition

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
    typeLabel: "{underline file.d.ts}"
  },
  {
    name: "source-encoding",
    type: String,
    description: "Encoding for typing files (default is {underline utf8})."
  },
  {
    name: "source-dir",
    type: String,
    description: "The source directory that contains typing files (optional).",
    typeLabel: "{underline directory}"
  },
  {
    name: "rto-module",
    description: "The rto.json file to process (one file allowed).",
    type: String,
    multiple: false,
    typeLabel: "{underline file.rto.json}"
  },
  {
    name: "rto-dir",
    type: String,
    description: "The source directory for rto.json file (optional).",
    typeLabel: "{underline directory}"
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
    description: "Encoding for JSON file to check (default is {underline utf8})."
  },
  {
    name: "json",
    description: "The JSON file to check (by default at last position, one file allowed).",
    type: String,
    multiple: false,
    defaultOption: true,
    typeLabel: "{underline file.json}"
  }
]

cli().catch(error => {
  console.error(`Error: ${error.message}`)
})

async function cli() {
  const options = parseOptions()
  if (!options) {
    printHelp()
    return
  }

  if (options["help"]) {
    printHelp()
    return
  }

  try {
    await processFile(options)
  } catch (error) {
    if (error.causeCode === "invalidArgument") {
      console.error(`Error: ${error.message}`)
      printHelp()
    } else
      throw error
  }
}

function printHelp() {
  const sections = [
    {
      header: "TypeOnly Checker CLI",
      content: "A CLI to check JSON files conformity with typing."
    },
    {
      header: "Synopsis",
      content: [
        "$ npx @typeonly/checker-cli {bold -s} {underline src/file-name.d.ts} {bold -t} {underline RootTypeName} {underline dir/data.json}",
        "$ npx @typeonly/checker-cli {bold --help}"
      ]
    },
    {
      header: "Options",
      optionList: optionDefinitions
    },
    {
      content: "Project home: {underline https://github.com/tomko-team/typeonly-checker-cli}"
    }
  ]
  const usage = commandLineUsage(sections)
  console.log(usage)
}

function parseOptions(): object | undefined {
  try {
    return commandLineArgs(optionDefinitions)
  } catch (error) {
    console.log(`Error: ${error.message}`)
    printHelp()
  }
}

async function processFile(options: object) {
  if (!options["source"] && !options["rto-module"])
    throw new InvalidArgumentError("Missing typing file or rto.json file.")
  if (options["source"] && options["rto-module"])
    throw new InvalidArgumentError("You must provide a typing file or a rto.json file not both.")
  if (!options["json"])
    throw new InvalidArgumentError("Missing input JSON file to check.")

  if (options["source"])
    await checkFromTypingFile(options)
  else
    await checkFromRtoFile(options)
}


async function checkFromRtoFile(options: object) {
  const moduleFile = options["rto-module"]
  const bnad = baseNameAndDir(moduleFile)
  const baseDir = normalizeDir(options["rto-dir"] || bnad.directory)
  const typeName = options["type"]
  const data = readJsonFileSync(options)

  let modulePath = normalizeModulePath(moduleFile, baseDir)
  if (modulePath.endsWith(".rto.json"))
    modulePath = modulePath.slice(0, -9)

  const checker = await createChecker({
    readModules: {
      modulePaths: [modulePath],
      baseDir
    },
    acceptAdditionalProperties: !!options["non-strict"]
  })

  const result = checker.check(modulePath, typeName, data)

  if (!result.valid) {
    console.error(result.error)
    process.exit(1)
  }
}

async function checkFromTypingFile(options: object) {
  let typingFile = options["source"] as string
  const bnad = baseNameAndDir(typingFile)
  const sourceDir = normalizeDir(options["source-dir"] || bnad.directory)

  if (typingFile.startsWith(sourceDir))
    typingFile = typingFile.substr(sourceDir.length + 1)

  const typeName = options["type"]

  const jsonData = readJsonFileSync(options)

  let sourceModulePath = normalizeModulePath(typingFile, sourceDir)
  if (!sourceModulePath.endsWith(".ts"))
    throw new InvalidArgumentError("Parameter 'source' must end with '.d.ts' or '.ts'")
  sourceModulePath = sourceModulePath.substr(0, sourceModulePath.length - (sourceModulePath.endsWith(".d.ts") ? 5 : 3))

  const rtoModules = await generateRtoModules({
    modulePaths: [sourceModulePath],
    readFiles: {
      sourceDir,
      encoding: options["source-encoding"] || undefined,
    },
    returnRtoModules: true
  }) as RtoModules


  const checker = await createChecker({
    readModules: {
      modulePaths: [sourceModulePath],
      rtoModules
    },
    acceptAdditionalProperties: !!options["non-strict"]
  })

  const result = checker.check(sourceModulePath, typeName, jsonData)

  if (!result.valid) {
    console.error(result.error)
    process.exit(1)
  }
}

function readJsonFileSync(options: object): unknown {
  const fileToCheck = options["json"]
  try {
    const data = readFileSync(fileToCheck, { encoding: options["json-encoding"] || "utf8" }) as any
    return JSON.parse(data)
  } catch (err) {
    throw new InvalidArgumentError(`Cannot read file: ${fileToCheck}`)
  }
}

function normalizeModulePath(file: string, sourceDir: string): string {
  const prefix = `${sourceDir}/`.replace(/\\/g, "/")
  file = file.replace(/\\/g, "/")
  if (file.startsWith(prefix))
    file = `./${file.substr(prefix.length)}`
  else if (!file.startsWith("./") && !file.startsWith("../"))
    file = `./${file}`
  return file
}

function normalizeDir(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+$/, "")
}

interface BaseNameAndDir {
  directory: string
  fileName: string
}

function baseNameAndDir(file: string): BaseNameAndDir {
  return {
    directory: dirname(file),
    fileName: basename(file),
  }
}


