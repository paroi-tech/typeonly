import { TypeOnlyAst } from "./ast"
import { parseTypeOnlyToAst } from "./parser/parse-typeonly"
import { RtoModule, RtoModules } from "./rto"
import { makeReadSourceFileAstProvider, RtoProjectOutput, WriteRtoFilesOptions } from "./rto-factory/ProjectInputOutput"
import RtoModuleFactory from "./rto-factory/RtoModuleFactory"
import RtoProject from "./rto-factory/RtoProject"

export interface ParseTypeOnlyOptions {
  source: string
  return?: {
    /**
     * Default value is `false`.
     */
    freeze?: boolean
  }
}

export function parseTypeOnly(options: ParseTypeOnlyOptions): TypeOnlyAst {
  const ast = parseTypeOnlyToAst(options.source)
  if (options.return && options.return.freeze)
    deepFreezePojo(ast)
  return ast
}

export interface GenerateRtoModulesOptions {
  modulePaths: string[]
  readFiles?: {
    sourceDir: string
    encoding?: string
  }
  astProvider?: TypeOnlyAstProvider
  defineGlobals?: (globals: Set<string>) => Set<string>
  writeFiles?: boolean | {
    encoding?: string
    outputDir?: string
    /**
     * The indentation parameter of `JSON.stringify`.
     */
    prettify?: number | string
  }
  returnRtoModules?: boolean | {
    /**
     * Default value is `false`.
     */
    freeze?: boolean
  }
}

export type TypeOnlyAstProvider = (modulePath: string) => Promise<TypeOnlyAst> | TypeOnlyAst

export async function generateRtoModules(options: GenerateRtoModulesOptions): Promise<RtoModules | undefined> {
  let astProvider = options.astProvider
  if (!astProvider) {
    if (!options.readFiles)
      throw new Error(`A parameter 'readFiles' or 'astProvider' is required.`)
    astProvider = makeReadSourceFileAstProvider(options.readFiles.sourceDir, options.readFiles.encoding || "utf8")
  }
  let wfOpt2: WriteRtoFilesOptions | undefined
  if (options.writeFiles) {
    const wfOpt1 = options.writeFiles === true ? {} : options.writeFiles
    const encoding = wfOpt1.encoding || "utf8"
    const outputDir = wfOpt1.outputDir || (!options.astProvider && options.readFiles && options.readFiles.sourceDir)
    if (!outputDir)
      throw new Error(`Option 'writeFiles.outputDir' is required when 'readFiles.sourceDir' is not provided.`)
    wfOpt2 = {
      encoding,
      outputDir,
      prettify: wfOpt1.prettify
    }
  }
  const output = new RtoProjectOutput({
    returnRtoModules: !!options.returnRtoModules,
    writeFiles: wfOpt2
  })
  const project = new RtoProject({
    astProvider,
    rtoModuleListener: output.listener,
    moduleFactoryOptions: {
      defineGlobals: options.defineGlobals
    }
  })
  await project.addModules(options.modulePaths)
  if (options.returnRtoModules) {
    const rtoModules = output.getRtoModules()
    if (options.returnRtoModules !== true && options.returnRtoModules.freeze)
      deepFreezePojo(rtoModules)
    return rtoModules
  }
}

export interface CreateStandaloneRtoModuleOptions {
  ast: TypeOnlyAst
  defineGlobals?: (globals: Set<string>) => Set<string>
  /**
   * Default value is `false`.
   */
  freeze?: boolean
}

export function createStandaloneRtoModule(options: CreateStandaloneRtoModuleOptions): RtoModule {
  const factory = new RtoModuleFactory(options.ast, undefined, { defineGlobals: options.defineGlobals })
  const rtoModule = factory.createRtoModule()
  if (options.freeze)
    deepFreezePojo(rtoModule)
  return rtoModule
}

function deepFreezePojo<T extends object>(object: T): T {
  if (Object.isFrozen(object))
    return object
  Object.freeze(object)
  for (const key of Object.keys(object)) {
    const value = object[key]
    if (value && typeof value === "object")
      deepFreezePojo(value)
  }
  return object
}