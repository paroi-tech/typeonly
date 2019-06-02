import * as fs from "fs"
import { join } from "path"
import { promisify } from "util"
import { RelativeModulePath, toModulePath } from "../helpers/module-path-helpers"
import { RtoModule } from "../rto"
import { Modules } from "../typeonly-reader"
import ModuleFactory from "./ModuleFactory"

const readFile = promisify(fs.readFile)

export type GetModuleFactory = (modulePath: RelativeModulePath) => ModuleFactory

export interface ProjectOptions {
  baseDir: string
  encoding: string
}

export default class Project {
  private factories = new Map<string, ModuleFactory>()

  constructor(private options: ProjectOptions) {
  }

  async parseModules(paths: string[]): Promise<Modules> {
    paths.forEach(path => {
      if (!path.startsWith("./") && !path.startsWith("../"))
        throw new Error(`A relative path is required for RTO module`)
    })
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

  private getModuleFactory(relPath: RelativeModulePath): ModuleFactory {
    const modulePath = toModulePath({
      ...relPath,
      removeExtensions: [".rto.json"]
    })
    const factory = this.factories.get(modulePath)
    if (!factory)
      throw new Error(`Unknown module: ${modulePath}`)
    return factory
  }

  private async loadRtoModule(relPath: RelativeModulePath) {
    const { baseDir, encoding } = this.options
    const modulePath = toModulePath({
      ...relPath,
      removeExtensions: [".rto.json"]
    })
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
}

async function readRtoFile(baseDir: string, modulePath: string, encoding: string) {
  const path = join(baseDir, modulePath)
  try {
    return await readFile(`${path}.rto.json`, { encoding })
  } catch {
    throw new Error(`Cannot open module file: ${path}.rto.json`)
  }
}