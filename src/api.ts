import { Modules, readModules, ReadModulesOptions } from "@typeonly/reader"
import Checker from "./Checker"


export async function createChecker(options: ReadModulesOptions): Promise<TypeOnlyChecker> {
  return createCheckerFromModules(await readModules(options))
}

export function createCheckerFromModules(modules: Modules): TypeOnlyChecker {
  const impl = new Checker(modules)
  return {
    check: (moduleName: string, typeName: string, val: unknown) => impl.check(moduleName, typeName, val)
  }
}

export interface TypeOnlyChecker {
  check(moduleName: string, typeName: string, val: unknown): CheckResult
}

export interface CheckResult {
  conform: boolean
  error?: string
}
