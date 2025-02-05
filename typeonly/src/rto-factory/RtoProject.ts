import type { TypeOnlyAstProvider } from "../api.js";
import { type RelativeModulePath, toModulePath } from "../helpers/module-path-helpers.js";
import type { RtoModule } from "../rto.d.ts";
import RtoModuleFactory, { type RtoModuleFactoryOptions } from "./RtoModuleFactory.js";

export interface RtoProjectOptions {
  astProvider: TypeOnlyAstProvider;
  rtoModuleListener: RtoModuleListener;
  moduleFactoryOptions?: RtoModuleFactoryOptions;
}

export type RtoModuleListener = (module: RtoModule, modulePath: string) => Promise<void> | void;

export default class RtoProject {
  private factories = new Map<string, RtoModuleFactory>();

  constructor(private options: RtoProjectOptions) { }

  async addModules(modulePaths: string[]) {
    for (const from of modulePaths) await this.importModule({ from });
    for (const factory of this.factories.values())
      await factory.loadImports((modulePath) => this.importModule(modulePath));
    for (const factory of this.factories.values()) {
      const module = factory.createRtoModule();
      await this.options.rtoModuleListener(module, factory.getModulePath());
    }
  }

  private async importModule(relPath: RelativeModulePath): Promise<RtoModuleFactory> {
    const modulePath = toModulePath({
      ...relPath,
      removeExtensions: [".d.ts", ".ts"],
    });
    let factory = this.factories.get(modulePath);
    if (!factory) {
      const ast = await this.options.astProvider(modulePath);
      factory = new RtoModuleFactory(ast, modulePath, this.options.moduleFactoryOptions);
      this.factories.set(modulePath, factory);
    }
    return factory;
  }
}
