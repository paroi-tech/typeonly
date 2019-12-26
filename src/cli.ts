#!/usr/bin/env node
import commandLineArgs = require("command-line-args")
import commandLineUsage = require("command-line-usage")
import { readdirSync, readFileSync, writeFileSync } from "fs"
import { basename, dirname, join } from "path"
import { generateRtoModules, parseTypeOnly } from "./api"
import { TypeOnlyAst } from "./ast"
import { RtoModules } from "./rto"
import { ensureDirectory } from "./rto-factory/ProjectInputOutput"

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
    description: "The source directory (optional when used with option {underline --ast} or with a single source file).",
    typeLabel: "{underline directory}"
  },
  {
    name: "encoding",
    alias: "e",
    type: String,
    description: "Encoding for input and output file(s) (default is {underline utf8})."
  },
  {
    name: "bundle",
    alias: "b",
    type: String,
    description: "Generate a bundle file for RTO data (optional)."
  },
  {
    name: "prettify",
    type: Boolean,
    description: "Prettify RTO files (optional)."
  },
  {
    name: "ast",
    type: Boolean,
    description: "Generate AST files instead of RTO files (optional)."
  },
  {
    name: "src",
    description: "Input files to process (by default at last position).",
    type: String,
    multiple: true,
    defaultOption: true,
    typeLabel: "{underline file} ..."
  }
]

cli().catch(error => {
  console.error(`Error: ${error.message}`, error)
})

async function cli() {
  const options = parseOptions()
  if (!options)
    return
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
  if (options["ast"]) {
    if (!options["src"])
      throw new InvalidArgumentError("Missing source file(s).")
    options["src"].map((file: string) => createAstJsonFile(file, options))
  } else
    await createRtoJsonFiles(options)
}

function createAstJsonFile(file: string, options: object) {
  file = options["source-dir"] ? join(options["source-dir"], file) : file
  const encoding: string = options["encoding"] || "utf8"
  let source: string
  try {
    source = readFileSync(file, { encoding })
  } catch (err) {
    throw new InvalidArgumentError(`Cannot read file: ${file}`)
  }

  let fileName = basename(file)
  if (fileName.endsWith(".ts"))
    fileName = fileName.substring(0, fileName.length - (fileName.endsWith(".d.ts") ? 5 : 3))

  const ast: TypeOnlyAst = parseTypeOnly({ source })
  const outFile = join(options["output-dir"] || dirname(file), `${fileName}.ast.json`)
  writeFileSync(outFile, JSON.stringify(ast, undefined, "\t"), { encoding })
}

async function createRtoJsonFiles(options: object) {
  let srcList = options["src"] ?? []
  let sourceDir: string
  if (!options["source-dir"]) {
    if (srcList.length === 1)
      sourceDir = dirname(srcList[0])
    else
      throw new Error("Missing 'source-dir' option.")
  } else
    sourceDir = options["source-dir"]
  sourceDir = normalizeDir(sourceDir)

  if (srcList.length === 0)
    srcList = getTypingFilesInDir(sourceDir)

  const modulePaths = normalizeModulePaths(srcList, sourceDir)
  const encoding: string = options["encoding"] ?? "utf8"
  const prettify = options["prettify"] ? "\t" : undefined
  let bundleName: string | undefined = options["bundle"]

  if (bundleName) {
    if (!bundleName.endsWith(".to.json"))
      bundleName += ".to.json"
    const rtoModules = await generateRtoModules({
      modulePaths,
      readFiles: {
        sourceDir,
        encoding,
      },
      returnRtoModules: true
    }) as RtoModules
    const outputDir = options["output-dir"] ? normalizeDir(options["output-dir"]) : undefined
    if (outputDir) {
      await ensureDirectory(outputDir)
      bundleName = join(outputDir, bundleName)
    }
    writeFileSync(bundleName, JSON.stringify(rtoModules, undefined, prettify), { encoding })
  } else {
    const outputDir = normalizeDir(options["output-dir"] ?? sourceDir)
    await generateRtoModules({
      modulePaths,
      readFiles: {
        sourceDir,
        encoding,
      },
      writeFiles: {
        outputDir,
        prettify
      }
    })
  }
}

function getTypingFilesInDir(dir: string): string[] {
  const files = readdirSync(dir)
  return files
    .filter(fileName => fileName.endsWith(".d.ts"))
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
