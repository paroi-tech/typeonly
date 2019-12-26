import { AsyncReadModulesOptions, isSyncReadModulesOptions, Modules, readModules, SyncReadModulesOptions } from "@typeonly/reader"
import Checker from "./Checker"

export interface CheckerOptions {
  acceptAdditionalProperties?: boolean
}

export interface SyncReadModulesCheckerOptions extends CheckerOptions, SyncReadModulesOptions {
}

export interface AsyncReadModulesCheckerOptions extends CheckerOptions, AsyncReadModulesOptions {
}

export type CreateCheckerOptions = SyncReadModulesCheckerOptions | AsyncReadModulesCheckerOptions

export function createChecker(options: SyncReadModulesCheckerOptions): TypeOnlyChecker
export function createChecker(options: AsyncReadModulesCheckerOptions): Promise<TypeOnlyChecker>
export function createChecker(options: CreateCheckerOptions): any {
  if (isSyncReadModulesOptions(options))
    return createCheckerSync(options)
  else
    return createCheckerAsync(options)
}

function createCheckerSync(options: SyncReadModulesCheckerOptions): TypeOnlyChecker {
  return createCheckerFromModules(readModules(options), options)
}

async function createCheckerAsync(options: AsyncReadModulesCheckerOptions): Promise<TypeOnlyChecker> {
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
