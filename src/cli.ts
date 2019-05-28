#!/usr/bin/env node
import commandLineArgs = require("command-line-args")
import commandLineUsage = require("command-line-usage")
import { existsSync, readFileSync, writeFileSync } from "fs"
import { basename, dirname, extname } from "path"
import { TypeOnlyAst } from "./ast"
import { parseTypeOnlyToAst } from "./parser/parse-typeonly"

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
    name: "output-dir",
    alias: "o",
    type: String,
    description: "The output directory (optional).",
    typeLabel: "{underline directory}"
  },
  {
    name: "encoding",
    alias: "e",
    type: String,
    description: "Encoding for input and output file(s) (default is {underline utf8})."
  },
  {
    name: "force",
    alias: "f",
    type: Boolean,
    description: "Overwrite output files."
  },
  {
    name: "src",
    description: "The input file to process (by default at last position).",
    type: String,
    multiple: true,
    defaultOption: true,
    typeLabel: "{underline file} ..."
  }
]

cli()

function cli() {
  const options = parseOptions()
  if (!options)
    return
  console.log(options["src"].toString())
  // if (options.) {
  //   console.log(Object.keys(options))
  // }
  if (options["help"]) {
    printHelp()
    return
  }

  try {
    proccessFile(options["src"].toString(), options)
  } catch (error) {
    if (error.causeCode === "invalidArgument") {
      console.error(`Error: ${error.message}`)
      printHelp()
    } else {
      console.error(`Error: ${error.message}`)
    }
  }
}

function printHelp() {
  const sections = [
    {
      header: "TypeOnly",
      content: "Parse TypeScript code with composite type and then generates a array of possible values"
    },
    {
      header: "Synopsis",
      content: [
        "$ node {underline dist/cli.js} {bold --src} {underline file}",
        "$ node {underline dist/cli.js} {bold --help}"
      ]
    },
    {
      header: "Options",
      optionList: optionDefinitions
    },
    {
      content: "Project home: {underline https://github.com/paleo/typeonly}"
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

function proccessFile(file: string, options) {
  if (!options.src)
    throw new InvalidArgumentError("Missing Source File")

  let input: string
  try {
    input = readFileSync(file, { encoding: options.encoding || "utf8" }) as any
  } catch (err) {
    throw new InvalidArgumentError(`Cannot read file: ${file}`)
  }
  const bnad = baseNameAndDir(file)
  const ast: TypeOnlyAst = parseTypeOnlyToAst(input)
  createAstJsonFile(ast, options, bnad)
}

function createAstJsonFile(ast: TypeOnlyAst, options, bnad: BaseNameAndDir) {
  const generateAst = JSON.stringify(ast, undefined, 2)
  const dir = normalizePath(options["output-dir"], bnad.directory)
  const outFile = `${dir}/${bnad.fileBaseName}.ast.json`
  if (!options.force && existsSync(outFile))
    throw new Error(`Cannot overwrite existing file: ${outFile}`)
  writeFileSync(outFile, generateAst, {
    encoding: options.encoding || "utf8",
  })
}

function normalizePath(path: string | undefined, defaultPath?: string): string | undefined {
  if (!path)
    return defaultPath
  path = path.replace(/\/+$/, "")
  if (path)
    return path
}

interface BaseNameAndDir {
  directory: string
  fileBaseName: string
  extension: string
}

function baseNameAndDir(file: string): BaseNameAndDir {
  const extension = extname(file)
  return {
    directory: dirname(file),
    fileBaseName: basename(file, extension),
    extension
  }
}
