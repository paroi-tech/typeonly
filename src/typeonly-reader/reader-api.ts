import * as fs from "fs"
import { join } from "path"
import { promisify } from "util"
import { RtoModule } from "../rto"
import { Modules } from "../typeonly-reader"
import Project from "./Project"

const readdir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)

export interface ReadModulesOptions {
  /**
   * Optional when `"readFiles"` is defined, then all the `.rto.json` files in `"baseDir"` are loaded.
   */
  modulePaths?: string[]
  readFiles?: {
    baseDir: string
    encoding?: string
  }
  rtoModuleProvider?: RtoModuleProvider
}

export type RtoModuleProvider = (modulePath: string) => Promise<RtoModule> | RtoModule

export async function readModules(options: ReadModulesOptions): Promise<Modules> {
  let { modulePaths, rtoModuleProvider } = options
  if (rtoModuleProvider) {
    if (!modulePaths)
      throw new Error(`Missing parameter 'modulePaths'`)
  } else {
    if (!options.readFiles)
      throw new Error(`An option 'readFiles' or 'rtoProvider' is required`)
    rtoModuleProvider = makeReadSourceFileRtoModuleProvider({
      baseDir: options.readFiles.baseDir,
      encoding: options.readFiles.encoding || "utf8"
    })
    if (!modulePaths)
      modulePaths = await getModulePathsInDir(options.readFiles.baseDir)
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
    return JSON.parse(data) as RtoModule
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