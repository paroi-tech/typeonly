#!/usr/bin/env node
import commandLineArgs = require("command-line-args")
import commandLineUsage = require("command-line-usage")

// class InvalidArgumentError extends Error {

// }

const optionDefinitions = [
  {
    name: "help",
    alias: "h",
    type: Boolean,
    description: "Print this help message."
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
  // console.log(options)
  if (options["help"]) {
    printHelp()
    return
  }

  // try {
  //   proccessFile(options)
  // } catch (error){
  //   console.log(`Error: ${error.message}`)
  // }
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
