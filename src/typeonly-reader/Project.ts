import * as fs from "fs"
import { dirname, join } from "path"
import { promisify } from "util"
import { RtoModule } from "../rto"
import { Modules } from "../typeonly-reader"
import ModuleFactory from "./ModuleFactory"

const readFile = promisify(fs.readFile)

export type GetModuleFactory = (modulePath: RelativeModulePath) => ModuleFactory

export interface RelativeModulePath {
  from: string
  relativeToModule?: string
}

export interface ProjectOptions {
  baseDir: string
  encoding: string
}

export default class Project {
  private factories = new Map<string, ModuleFactory>()

  constructor(private options: ProjectOptions) {
  }

  async parseModules(paths: string[]): Promise<Modules> {
    for (const from of paths)
      await this.loadRtoModule({ from })
    const modules: Modules = {}
    for (const factory of this.factories.values()) {
      const module = factory.createModule(modulePath => this.getModuleFactory(modulePath))
      if (!module.path)
        throw new Error(`Missing path in module`)
      modules[module.path] = module
    }
    return modules
  }

  private getModuleFactory(modulePath: RelativeModulePath): ModuleFactory {
    const pathInProject = this.pathInProject(modulePath)
    const factory = this.factories.get(pathInProject)
    if (!factory)
      throw new Error(`Unknown module: ${pathInProject}`)
    return factory
  }

  private async loadRtoModule(rmp: RelativeModulePath) {
    const { baseDir, encoding } = this.options
    const modulePath = this.pathInProject(rmp)
    let factory = this.factories.get(modulePath)
    if (!factory) {
      const data = await readRtoFile(baseDir, modulePath, encoding)
      const rtoModule = JSON.parse(data) as RtoModule
      factory = new ModuleFactory(rtoModule, modulePath)
      this.factories.set(modulePath, factory)
      await this.loadImports(factory, modulePath)
    }
  }

  private async loadImports(factory: ModuleFactory, modulePath: string) {
    if (factory.rtoModule.imports) {
      for (const { from } of factory.rtoModule.imports)
        await this.loadRtoModule({ from, relativeToModule: modulePath })
    }
    if (factory.rtoModule.namespacedImports) {
      for (const { from } of factory.rtoModule.namespacedImports)
        await this.loadRtoModule({ from, relativeToModule: modulePath })
    }
  }

  private pathInProject({ from, relativeToModule }: RelativeModulePath): string {
    if (from.endsWith(".rto.json"))
      from = from.slice(0, from.length - 9)
    const { baseDir } = this.options
    const firstChar = from[0]
    if (firstChar === "/") {
      if (!from.startsWith(baseDir))
        throw new Error(`Cannot import a RTO module outside the project: ${from}`)
      return from.slice(baseDir.length)
    }
    if (firstChar === ".")
      return relativeToModule ? join(dirname(relativeToModule), from) : from
    throw new Error(`Module path must start with '.' or '/'`)
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