import { Modules, readModules, ReadModulesOptions } from "@typeonly/reader"
import Checker from "./Checker"

export interface CheckerOptions {
  acceptAdditionalProperties?: boolean
}

export interface CreateCheckerOptions extends CheckerOptions, ReadModulesOptions {
}

export async function createChecker(options: CreateCheckerOptions): Promise<TypeOnlyChecker> {
  return createCheckerFromModules(await readModules(options), options)
}

export function createCheckerFromModules(modules: Modules, options?: CheckerOptions): TypeOnlyChecker {
  const checker = new Checker(modules, options)
  return {
    check: (moduleName: string, typeName: string, val: unknown) => checker.check(moduleName, typeName, val)
  }
}

export interface TypeOnlyChecker {
  check(moduleName: string, typeName: string, val: unknown): CheckResult
}

export interface CheckResult {
  valid: boolean
  error?: string
}
