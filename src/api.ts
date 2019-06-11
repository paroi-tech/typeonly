import * as fs from "fs"
import { join } from "path"
import { promisify } from "util"
import Project from "./reader/Project"
import { Modules, Type } from "./typeonly-reader"

const readdir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)

export interface ReadModulesOptions {
  /**
   * Optional when `"readFiles"` is defined, then all the `.rto.json` files in `"baseDir"` are loaded.
   */
  modulePaths?: string[]
  baseDir?: string
  encoding?: string
  rtoModuleProvider?: RtoModuleProvider
  /**
   * Of type: `RtoModules`.
   */
  rtoModules?: any
}

/**
 * The returned type is `Promise<RtoModule> | RtoModule`.
 */
export type RtoModuleProvider = (modulePath: string) => Promise<any> | any

export async function readModules(options: ReadModulesOptions): Promise<Modules> {
  let { modulePaths, rtoModuleProvider } = options
  if (rtoModuleProvider || options.rtoModules) {
    if (options.baseDir)
      throw new Error(`Do not use 'baseDir' with 'rtoModuleProvider' or 'rtoModules'`)
    if (!rtoModuleProvider) {
      if (rtoModuleProvider)
        throw new Error(`Do not use 'rtoModuleProvider' with 'rtoModules'`)
      const rtoModules = options.rtoModules as any
      rtoModuleProvider = modulePath => {
        const rtoModule = rtoModules[modulePath]
        if (!rtoModule)
          throw new Error(`Unknown module: ${modulePath}`)
        return rtoModule
      }
    }
    if (!modulePaths)
      throw new Error(`Missing parameter 'modulePaths'`)
  } else {
    if (!options.baseDir)
      throw new Error(`An option 'baseDir', 'rtoModuleProvider' or 'rtoModules' is required`)
    rtoModuleProvider = makeReadSourceFileRtoModuleProvider({
      baseDir: options.baseDir,
      encoding: options.encoding || "utf8"
    })
    if (!modulePaths)
      modulePaths = await getModulePathsInDir(options.baseDir)
  }
  const project = new Project({ rtoModuleProvider })
  const modules = await project.parseModules(modulePaths)
  return modules
}

async function getModulePathsInDir(dir: string): Promise<string[]> {
  const files = await readdir(dir)
  return files
    .filter(fileName => fileName.endsWith(".rto.json"))
    .map(fileName => `./${fileName}`)
}

function makeReadSourceFileRtoModuleProvider(options: { baseDir: string, encoding: string }): RtoModuleProvider {
  return async (modulePath: string) => {
    const { baseDir, encoding } = options
    const data = await readRtoFile(baseDir, modulePath, encoding)
    return JSON.parse(data)
  }
}

async function readRtoFile(baseDir: string, modulePath: string, encoding: string) {
  const path = join(baseDir, modulePath)
  try {
    return await readFile(`${path}.rto.json`, { encoding })
  } catch {
    throw new Error(`Cannot open module file: ${path}.rto.json`)
  }
}

export function literals(type: Type, only: "string"): string[]
export function literals(type: Type, only: "number"): number[]
export function literals(type: Type, only: "bigint"): Array<bigint>
export function literals(type: Type, only: "boolean"): boolean[]
export function literals(type: Type): Array<string | number | bigint | boolean>
export function literals(type: Type, only?: string): any[] {
  let children: Type[]
  if (type.kind !== "composite" || type.op !== "union") {
    if (type.kind === "literal")
      children = [type]
    else
      throw new Error(`Should be a union`)
  } else
    children = type.types
  return children.map(child => {
    if (child.kind !== "literal")
      throw new Error(`Should be a 'literal': '${type.kind}'`)
    if (only && typeof child.literal !== only)
      throw new Error(`Literal should be a '${only}': '${typeof child.literal}'`)
    return child.literal
  })
}
