import * as fs from "fs"
import { join } from "path"
import { promisify } from "util"
import { parseTypeOnlyToAst } from "../parser/parse-typeonly"
import RtoModuleFactory from "./RtoModuleFactory"

const readFile = promisify(fs.readFile)

export interface ModuleImport {
  relativeTo?: string
  path: string
}

export default class Project {
  private factories = new Map<string, RtoModuleFactory>()

  constructor(private rootDir: string, private encoding: string) {
  }

  async importModule({ path, relativeTo }: ModuleImport): Promise<RtoModuleFactory> {
    const pathInProject = relativeTo ? join(relativeTo, path) : path
    let factory = this.factories.get(pathInProject)
    if (!factory) {
      const source = await readFile(join(this.rootDir, pathInProject), this.encoding)
      const ast = parseTypeOnlyToAst(source)
      factory = new RtoModuleFactory(this, ast, pathInProject)
    }
    return factory
  }
}