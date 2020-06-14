import * as fs from "fs"
import { join } from "path"
import { promisify } from "util"
import Project from "./reader/Project"
import { Modules, Type } from "./typeonly-reader"

const readdir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)

export type ReadModulesOptions = SyncReadModulesOptions | AsyncReadModulesOptions

export interface SyncReadModulesOptions {
  /**
   * Optional when `"modules"` is defined.
   */
  modulePaths?: string[]
  /**
   * Of type: `RtoModules`.
   */
  bundle: any
}

export interface AsyncReadModulesOptions {
  /**
   * Optional when `"modules"` is defined.
   */
  modulePaths: string[]
  baseDir?: string
  encoding?: string
  rtoModuleProvider?: RtoModuleProvider
}

/**
 * The returned type is `Promise<RtoModule> | RtoModule`.
 */
export type RtoModuleProvider = (modulePath: string) => Promise<any> | any

export function readModules(options: SyncReadModulesOptions): Modules
export function readModules(options: AsyncReadModulesOptions): Promise<Modules>
export function readModules(options: ReadModulesOptions): any {
  if (isSyncReadModulesOptions(options))
    return readModulesSync(options)
  else
    return readModulesAsync(options)
}

export function isSyncReadModulesOptions(options: ReadModulesOptions): options is SyncReadModulesOptions {
  return !!(options as any)["bundle"]
}

function readModulesSync(options: SyncReadModulesOptions): Modules {
  let { modulePaths, bundle } = options
  const rtoModuleProvider = (modulePath: string) => {
    const rtoModule = bundle[modulePath]
    if (!rtoModule)
      throw new Error(`Unknown module: ${modulePath}`)
    return rtoModule
  }
  if (!modulePaths)
    modulePaths = Object.keys(bundle)
  const project = new Project({ rtoModuleProvider })
  return project.parseModulesSync(modulePaths)
}

async function readModulesAsync(options: AsyncReadModulesOptions): Promise<Modules> {
  let { modulePaths, rtoModuleProvider } = options
  if (rtoModuleProvider) {
    if (options.baseDir)
      throw new Error(`Do not use 'baseDir' with 'rtoModuleProvider' or 'modules'`)
    if (!modulePaths)
      throw new Error(`Missing parameter 'modulePaths'`)
  } else {
    if (!options.baseDir)
      throw new Error(`An option 'baseDir', 'rtoModuleProvider' or 'modules' is required`)
    rtoModuleProvider = makeReadSourceFileRtoModuleProvider({
      baseDir: options.baseDir,
      encoding: options.encoding || "utf8"
    })
    if (!modulePaths)
      modulePaths = await getModulePathsInDir(options.baseDir)
  }
  const project = new Project({ rtoModuleProvider })
  return await project.parseModulesAsync(modulePaths)
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
    return await readFile(`${path}.rto.json`, encoding)
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
