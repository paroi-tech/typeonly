import { AsyncReadModulesOptions, isSyncReadModulesOptions, Modules, readModules, SyncReadModulesOptions } from "@typeonly/reader"
import Validator from "./Validator"

export interface ValidatorOptions {
  acceptAdditionalProperties?: boolean
}

export interface SyncReadModulesValidatorOptions extends ValidatorOptions, SyncReadModulesOptions {
}

export interface AsyncReadModulesValidatorOptions extends ValidatorOptions, AsyncReadModulesOptions {
}

export type CreateValidatorOptions = SyncReadModulesValidatorOptions | AsyncReadModulesValidatorOptions

export function createValidator(options: SyncReadModulesValidatorOptions): TypeOnlyValidator
export function createValidator(options: AsyncReadModulesValidatorOptions): Promise<TypeOnlyValidator>
export function createValidator(options: CreateValidatorOptions): any {
  if (isSyncReadModulesOptions(options))
    return createValidatorSync(options)
  else
    return createValidatorAsync(options)
}

function createValidatorSync(options: SyncReadModulesValidatorOptions): TypeOnlyValidator {
  return createValidatorFromModules(readModules(options), options)
}

async function createValidatorAsync(options: AsyncReadModulesValidatorOptions): Promise<TypeOnlyValidator> {
  return createValidatorFromModules(await readModules(options), options)
}

export function createValidatorFromModules(modules: Modules, options?: ValidatorOptions): TypeOnlyValidator {
  const validator = new Validator(modules, options)
  return {
    validate: (typeName: string, val: unknown, moduleName?: string) => {
      if (!moduleName)
        moduleName = getDefaultModuleName(modules, typeName)
      return validator.validate(moduleName, typeName, val)
    }
  }
}

function getDefaultModuleName(modules: Modules, typeName: string): string {
  const candidates = []
  for (const moduleName of Object.keys(modules)) {
    const module = modules[moduleName]
    if (module.namedTypes[typeName])
      candidates.push(moduleName)
  }
  if (candidates.length === 0)
    throw new Error(`Cannot find type '${typeName}' in modules.`)
  if (candidates.length > 1)
    throw new Error(`There are several module candidates for type '${typeName}': '${candidates.join("', '")}'.`)
  return candidates[0]
}

export interface TypeOnlyValidator {
  validate(typeName: string, val: unknown, moduleName?: string): ValidateResult
}

export interface ValidateResult {
  valid: boolean
  error?: string
}
