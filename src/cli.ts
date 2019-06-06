#!/usr/bin/env node
import commandLineArgs = require("command-line-args")
import commandLineUsage = require("command-line-usage")
import { existsSync, readFileSync, writeFileSync } from "fs"
import { basename, dirname, join } from "path"
import { generateRtoModules, parseTypeOnly } from "./api"
import { TypeOnlyAst } from "./ast"
import { parseTypeOnlyToAst } from "./parser/parse-typeonly"
import { RtoModule } from "./rto"

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
    name: "source-dir",
    alias: "s",
    type: String,
    description: "The source directory (optional when used with option {underline --ast}).",
    typeLabel: "{underline directory}"
  },
  {
    name: "encoding",
    alias: "e",
    type: String,
    description: "Encoding for input and output file(s) (default is {underline utf8})."
  },
  {
    name: "ast",
    type: Boolean,
    description: "Generate AST files instead of RTO files (optional)."
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

cli().catch(error => {
  console.error(`Error: ${error.message}`)
})

async function cli() {
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
    await processFiles(options)
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
      header: "TypeOnly",
      content: "TypeOnly Parser."
    },
    {
      header: "Synopsis",
      content: [
        "$ npx typeonly {bold --source-dir} {underline src/} {underline file-name.d.ts}",
        "$ npx typeonly {bold --help}"
      ]
    },
    {
      header: "Options",
      optionList: optionDefinitions
    },
    {
      content: "Project home: {underline https://github.com/tomko-team/typeonly}"
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

async function processFiles(options: object) {
  if (!options["src"])
    throw new InvalidArgumentError("Missing source file(s).")
  if (options["ast"])
    options["src"].map((file: string) => createAstJsonFile(file, options))
  else
    await createRtoJsonFiles(options)
}

function createAstJsonFile(file: string, options: object) {
  file = options["source-dir"] ? join(options["source-dir"], file) : file
  let source: string
  try {
    source = readFileSync(file, { encoding: options["encoding"] || "utf8" }) as any
  } catch (err) {
    throw new InvalidArgumentError(`Cannot read file: ${file}`)
  }

  const bnad = baseNameAndDir(file)
  let fileName = bnad.fileName
  if (fileName.endsWith(".ts"))
    fileName = fileName.substring(0, fileName.length - (fileName.endsWith(".d.ts") ? 5 : 3))

  const ast: TypeOnlyAst = parseTypeOnly({ source })
  const outFile = join(options["output-dir"] || bnad.directory, `${fileName}.ast.json`)
  writeFileSync(outFile, JSON.stringify(ast, undefined, "\t"), {
    encoding: options["encoding"] || "utf8",
  })
}

async function createRtoJsonFiles(options: object) {
  if (!options["source-dir"])
    throw new Error("Missing source-dir option")
  const sourceDir = normalizeDir(options["source-dir"])
  const outputDir = normalizeDir(options["output-dir"] || options["source-dir"])

  const modulePaths = normalizeModulePaths(options["src"], sourceDir)
  const encoding = options["encoding"] || "utf8"
  await generateRtoModules({
    modulePaths,
    readFiles: {
      encoding,
      sourceDir,
    },
    writeFiles: {
      encoding,
      outputDir,
      prettify: "\t"
    }
  })
}

function normalizeModulePaths(files: string[], sourceDir: string): string[] {
  const prefix = `${sourceDir}/`.replace(/\\/g, "/")
  return files.map(file => {
    file = file.replace(/\\/g, "/")
    if (file.startsWith(prefix))
      file = `./${file.substr(prefix.length)}`
    else if (!file.startsWith("./") && !file.startsWith("../"))
      file = `./${file}`
    return file
  })
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
