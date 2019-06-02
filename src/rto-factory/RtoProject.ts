import { dirname, join } from "path"
import { TypeOnlyAstProvider } from "../api"
import { RtoModule } from "../rto"
import { RelativeModulePath } from "./internal-types"
import RtoModuleFactory from "./RtoModuleFactory"

export interface RtoProjectOptions {
  astProvider: TypeOnlyAstProvider
  rtoModuleListener: RtoModuleListener
}

export type RtoModuleListener = (module: RtoModule, modulePath: string) => Promise<void> | void

export default class RtoProject {
  private factories = new Map<string, RtoModuleFactory>()

  constructor(private options: RtoProjectOptions) {
  }

  async addModules(modulePaths: string[]) {
    for (const from of modulePaths)
      await this.importModule({ from })
    for (const factory of this.factories.values())
      await factory.loadImports(modulePath => this.importModule(modulePath))
    for (const factory of this.factories.values()) {
      const module = factory.createRtoModule()
      this.options.rtoModuleListener(module, factory.getModulePath())
    }
  }

  private async importModule(rmp: RelativeModulePath): Promise<RtoModuleFactory> {
    const modulePath = this.pathInProject(rmp)
    let factory = this.factories.get(modulePath)
    if (!factory) {
      const ast = await this.options.astProvider(modulePath)
      factory = new RtoModuleFactory(ast, modulePath)
      this.factories.set(modulePath, factory)
    }
    return factory
  }

  private pathInProject({ from, relativeToModule }: RelativeModulePath): string {
    if (from.endsWith(".ts")) {
      const extLength = from.endsWith(".d.ts") ? 5 : 3
      from = from.slice(0, from.length - extLength)
    }
    const firstChar = from[0]
    if (firstChar === ".")
      return relativeToModule ? join(dirname(relativeToModule), from) : from
    throw new Error(`Module path must start with '.' or '/'`)
  }
}
