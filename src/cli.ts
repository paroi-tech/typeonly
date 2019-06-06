#!/usr/bin/env node
import commandLineArgs = require("command-line-args")
import commandLineUsage = require("command-line-usage")
import { readFileSync } from "fs"
import { basename, dirname, join } from "path"
import { createChecker } from "./api"

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
    name: "base-dir",
    alias: "s",
    type: String,
    description: "The source directory (optional).",
    typeLabel: "{underline directory}"
  },
  {
    name: "module",
    alias: "m",
    type: String,
    multiple: false,
    description: "The module '.rto.json' file relative to the base directory.",
    typeLabel: "{underline file-name}"
  },
  {
    name: "type",
    alias: "t",
    type: String,
    description: "The type name of the root element in JSON.",
  },
  {
    name: "encoding",
    alias: "e",
    type: String,
    description: "Encoding for input file (default is {underline utf8})."
  },
  {
    name: "input",
    description: "The JSON file to check (by default at last position, One input file allowed).",
    type: String,
    multiple: false,
    defaultOption: true,
    typeLabel: "{underline file} ..."
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
      header: "TypeOnly Checker",
      content: "Checks data conformity, for example a JSON data."
    },
    {
      header: "Synopsis",
      content: [
        "$ npx @typeonly/checker {bold -m} {underline src/file-name.rto.json} {underline dir/data.json} {bold -t} {underline root-type-name}",
        "$ npx @typeonly/checker {bold --help}"
      ]
    },
    {
      header: "Options",
      optionList: optionDefinitions
    },
    {
      content: "Project home: {underline https://github.com/tomko-team/typeonly-checker}"
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
  if (!options["module"])
    throw new InvalidArgumentError("Missing module file.")
  if (!options["input"])
    throw new InvalidArgumentError("Missing input JSON file to check.")

  const moduleFile = options["module"]
  const bnad = baseNameAndDir(moduleFile)
  const baseDir = normalizeDir(options["base-dir"] ? options["base-dir"] : bnad.directory)
  const typeName = options["type"]
  const data = readInputFileSync(options)

  let modulePath = normalizeModulePath(moduleFile, baseDir)
  if (modulePath.endsWith(".rto.json"))
    modulePath = modulePath.slice(0, -9)

  const checker = await createChecker({
    modulePaths: [modulePath],
    readFiles: {
      baseDir
    }
  })

  const result = checker.check(modulePath, typeName, data)

  if (result.conform) {
    console.info("The JSON file is conform.")
  } else {
    console.error(result.error)
    process.exit(1)
  }
}

function readInputFileSync(options: object): unknown {
  const fileToCheck = options["input"]
  try {
    const data = readFileSync(fileToCheck, { encoding: options["encoding"] || "utf8" }) as any
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


