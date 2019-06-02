import * as fs from "fs"
import { join } from "path"
import { promisify } from "util"
import { TypeOnlyAstProvider } from "../api"
import { parseTypeOnlyToAst } from "../parser/parse-typeonly"
import { RtoModule, RtoModules } from "../rto"
import { RtoModuleListener } from "./RtoProject"

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

export interface RtoProjectOutputOptions {
  writeFiles?: WriteRtoFilesOptions
  returnRtoModules: boolean
}

export interface WriteRtoFilesOptions {
  encoding: string
  outputDir: string
  /**
   * The indentation parameter of `JSON.stringify`.
   */
  prettify?: number | string
}

export class RtoProjectOutput {
  readonly listener: RtoModuleListener

  private modules = new Map<string, RtoModule>()

  constructor(options: RtoProjectOutputOptions) {
    this.listener = async (module: RtoModule, modulePath: string) => {
      if (options.writeFiles)
        await this.writeModuleFile(module, modulePath, options.writeFiles)
      if (options.returnRtoModules)
        this.modules.set(modulePath, module)
    }
  }

  getRtoModules(): RtoModules {
    const result: RtoModules = {}
    for (const [modulePath, module] of this.modules)
      result[modulePath] = module
    return result
  }

  private async writeModuleFile(module: RtoModule, modulePath: string, options: WriteRtoFilesOptions) {
    const data = JSON.stringify(module, undefined, options.prettify)
    const outputFile = `${join(options.outputDir, modulePath)}.rto.json`
    await writeFile(outputFile, data, { encoding: options.encoding })
  }
}

export function makeReadSourceFileAstProvider(sourceDir: string, encoding: string): TypeOnlyAstProvider {
  return async (modulePath: string) => {
    const source = await readModuleFile(sourceDir, modulePath, encoding)
    return parseTypeOnlyToAst(source)
  }
}

async function readModuleFile(sourceDir: string, modulePath: string, encoding: string) {
  const path = join(sourceDir, modulePath)
  try {
    return await readFile(`${path}.d.ts`, { encoding })
  } catch {
  }
  try {
    return await readFile(`${path}.ts`, { encoding })
  } catch {
  }
  throw new Error(`Cannot open module file: ${path}.d.ts`)
}