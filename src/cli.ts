#!/usr/bin/env node
// import commandLineArgs = require("command-line-args")
import commandLineArgs = require("command-line-args")
import commandLineUsage = require("command-line-usage")
import { existsSync, readFileSync, writeFileSync } from "fs"
import { basename, dirname } from "path"
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
  // console.log(options["src"].toString())
  // if (options.) {
  //   console.log(Object.keys(options))
  // }
  if (options["help"]) {
    printHelp()
    return
  }

  try {
    if (options["src"] !== undefined) {
      proccessFile(options["src"].toString(), options)
    } else {
      console.error(`Error: Missing option.`)
      printHelp()
    }
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
      content: "Parse TypeOnly code."
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
  // const fileName = bnad.fileBaseName
  // console.log(fileName.substring(0, fileName.length - 2))
  const ast: TypeOnlyAst = parseTypeOnlyToAst(input)
  createAstJsonFile(ast, options, bnad)
}

function createAstJsonFile(ast: TypeOnlyAst, options, bnad: BaseNameAndDir) {
  const generateAst = JSON.stringify(ast, undefined, 2)
  const dir = normalizePath(options["output-dir"], bnad.directory)
  let fileName = bnad.fileName
  if (fileName.endsWith(".ts"))
    fileName = fileName.substring(0, fileName.length - (fileName.endsWith(".d.ts") ? 5 : 3))
  const outFile = `${dir}/${fileName}.ast.json`
  if (!options.force && existsSync(outFile))
    throw new Error(`Cannot overwrite existing file: ${outFile}`)
  // console.info(`Write file: ${outFile}`)
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
  fileName: string
}

function baseNameAndDir(file: string): BaseNameAndDir {
  return {
    directory: dirname(file),
    fileName: basename(file),
  }
}
