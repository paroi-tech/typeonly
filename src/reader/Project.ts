import { RtoModuleProvider } from "../api"
import { RelativeModulePath, toModulePath } from "../helpers/module-path-helpers"
import { Modules } from "../typeonly-reader"
import ModuleFactory from "./ModuleFactory"

export type GetModuleFactory = (modulePath: RelativeModulePath) => ModuleFactory

export interface ProjectOptions {
  moduleProvider: RtoModuleProvider
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
    const modulePath = toModulePath({
      ...relPath,
      removeExtensions: [".rto.json"]
    })
    let factory = this.factories.get(modulePath)
    if (!factory) {
      const rtoModule = await this.options.moduleProvider(modulePath)
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
