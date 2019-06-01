import * as fs from "fs"
import { join } from "path"
import { promisify } from "util"
import { parseTypeOnlyToAst } from "../parser/parse-typeonly"
import RtoModuleFactory from "./RtoModuleFactory"

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

export type ModuleLoader = (modulePath: ModulePath) => Promise<RtoModuleFactory>

export interface ModulePath {
  from: string
  relativeTo?: string
}

export interface ProjectOptions {
  inputDir: string
  encoding: string
  outputDir?: string
  prettify?: boolean
}

export default class Project {
  private factories = new Map<string, RtoModuleFactory>()

  constructor(private options: ProjectOptions) {
  }

  async parseModules(paths: string[]) {
    const { inputDir, encoding, prettify } = this.options
    const outputDir = this.options.outputDir || inputDir
    for (const from of paths)
      await this.importModule({ from })
    for (const factory of this.factories.values())
      await factory.loadImports(modulePath => this.importModule(modulePath))
    for (const factory of this.factories.values()) {
      const module = factory.getRtoModule()
      const data = prettify ? JSON.stringify(module, undefined, 2) : JSON.stringify(module)
      const outputFile = `${join(outputDir, factory.getModulePath())}.rto.json`
      await writeFile(outputFile, data, { encoding })
    }
  }

  private async importModule(modulePath: ModulePath): Promise<RtoModuleFactory> {
    const { inputDir, encoding } = this.options
    const pathInProject = this.pathInProject(modulePath)
    let factory = this.factories.get(pathInProject)
    if (!factory) {
      const source = await readModuleFile(inputDir, pathInProject, encoding)
      const ast = parseTypeOnlyToAst(source)
      factory = new RtoModuleFactory(ast, pathInProject)
      this.factories.set(pathInProject, factory)
    }
    return factory
  }

  private pathInProject({ from, relativeTo }: ModulePath): string {
    if (from.endsWith(".ts")) {
      const extLength = from.endsWith(".d.ts") ? 5 : 3
      from = from.slice(0, from.length - extLength)
    }
    const { inputDir } = this.options
    const firstChar = from[0]
    if (firstChar === "/") {
      if (!from.startsWith(inputDir))
        throw new Error(`Cannot import module outside the project: ${from}`)
      return from.slice(inputDir.length)
    }
    if (firstChar === ".")
      return relativeTo ? join(relativeTo, from) : from
    throw new Error(`Module path must start with '.' or '/'`)
  }
}

async function readModuleFile(baseDir: string, moduleName: string, encoding: string) {
  const path = join(baseDir, moduleName)
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