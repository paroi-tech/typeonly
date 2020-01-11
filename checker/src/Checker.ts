import { ArrayType, CompositeType, FunctionType, GenericInstance, GenericParameterName, ImportedTypeRef, IndexSignature, Interface, KeyofType, LiteralType, LocalTypeRef, MemberNameLiteral, MemberType, Modules, Properties, Property, TupleType, Type, TypeName } from "@typeonly/reader"
import { CheckerOptions, TypeOnlyChecker } from "./api"
import { makeErrorMessage, typeAsString } from "./error-message"
import { hasAncestor } from "./helpers"

export interface CheckResult {
  valid: boolean
  error?: string
}

type InternalResult = { valid: true, unmatch?: undefined } | InternalInvalidResult

interface InternalInvalidResult {
  valid: false
  unmatchs: Unmatch[]
}

export interface Unmatch {
  val: unknown
  type: Type
  cause?: string
  parentContextMsg?: string
  score?: number
}

interface Scope {
  interfaceScope?: InterfaceScope
}

interface InterfaceScope {
  firstInvalid?: InternalInvalidResult
  remainingPropNames: Set<string>
  validPropCount: number
  invalidPropCount: number
}

interface InterfaceContext {
  type: Type
  val: object
  scopeOwner: boolean
  scope: Scope
  interfaceScope: InterfaceScope
}

export default class Checker implements TypeOnlyChecker {
  private typeCheckers: {
    [K in Type["kind"]]: (type: any, val: unknown, scope?: Scope) => InternalResult
  } = {
      name: (type, val) => this.checkTypeName(type, val),
      localRef: (type, val, scope) => this.checkLocalTypeRef(type, val, scope),
      importedRef: (type, val, scope) => this.checkImportedTypeRef(type, val, scope),
      interface: (type, val, scope) => this.checkInterface(type, val, scope),
      array: (type, val) => this.checkArrayType(type, val),
      composite: (type, val, scope) => this.checkCompositeType(type, val, scope),
      function: (type, val) => this.checkFunctionType(type, val),
      genericInstance: (type, val) => this.checkGenericInstance(type, val),
      genericParameterName: (type, val) => this.checkGenericParameterName(type, val),
      keyof: (type, val) => this.checkKeyofType(type, val),
      literal: (type, val) => this.checkLiteralType(type, val),
      member: (type, val) => this.checkMemberType(type, val),
      tuple: (type, val) => this.checkTupleType(type, val),
    }

  constructor(private modules: Modules, private options: CheckerOptions = {}) {
  }

  check(moduleName: string, typeName: string, val: unknown): CheckResult {
    const module = this.modules[moduleName]
    if (!module)
      throw new Error(`Unknown module: ${moduleName}`)
    const namedType = module.namedTypes[typeName]
    if (!namedType || !namedType.exported)
      throw new Error(`Module '${moduleName}' has no exported type: ${typeName}`)
    const result = this.checkType(namedType, val)

    if (result.valid)
      return { valid: true }

    return {
      valid: false,
      error: makeErrorMessage(result.unmatchs)
    }
  }

  private checkType(type: Type, val: unknown, parentContextMessage?: () => string, scope?: Scope): InternalResult {
    const checker = this.typeCheckers[type.kind]
    if (!checker)
      throw new Error(`Unexpected kind: ${type.kind}`)
    const result = checker(type, val, scope)
    if (!result.valid && parentContextMessage) {
      const last = result.unmatchs[result.unmatchs.length - 1]
      if (last)
        last.parentContextMsg = parentContextMessage()
    }
    return result
  }

  private checkTypeName(type: TypeName, val: unknown): InternalResult {
    if (type.group === "primitive") {
      if (type.refName === "null") {
        if (val === null)
          return { valid: true }
      } else if (typeof val === type.refName)
        return { valid: true }
      return { valid: false, unmatchs: [{ type, val }] }
    }

    if (type.group === "ts") {
      if (type.refName === "object" && typeof val !== "object") {
        return { valid: false, unmatchs: [{ type, val }] }
      }
      if (type.refName === "void" && typeof val !== undefined) {
        return { valid: false, unmatchs: [{ type, val }] }
      }
      if (type.refName === "never") {
        return { valid: false, unmatchs: [{ type, val }] }
      }

      return { valid: true }
    }

    if (type.group === "global") {
      if (hasAncestor(val, type.refName))
        return { valid: true }
      const cause = `is not a ${type.refName}`
      return { valid: false, unmatchs: [{ type, val, cause }] }
    }

    throw new Error(`Unexpected group: ${type.group}.`)
  }

  private checkInterface(type: Interface, val: unknown, scope: Scope | undefined): InternalResult {
    if (!val || typeof val !== "object")
      return { valid: false, unmatchs: [{ type, val }] }

    const context = this.makeInterfaceContext(type, val as object, scope)

    if (type.mappedIndexSignature)
      throw new Error(`MappedIndexSignature not yet implemented.`)

    if (type.indexSignature)
      this.checkIndexSignature(type.indexSignature, context)

    if (type.properties)
      this.checkProperties(type.properties, context)

    if (context.scopeOwner)
      this.endOfInterfaceScopeOwner(context)

    return (context.scopeOwner && context.interfaceScope.firstInvalid) || { valid: true }
  }

  private makeInterfaceContext(type: Type, val: object, scope: Scope | undefined): InterfaceContext {
    let interfaceScope: InterfaceScope
    let scopeOwner: boolean
    if (scope && scope.interfaceScope) {
      interfaceScope = scope.interfaceScope
      scopeOwner = false
    } else {
      interfaceScope = {
        remainingPropNames: new Set(Object.keys(val)),
        validPropCount: 0,
        invalidPropCount: 0
      }
      scope = { interfaceScope }
      scopeOwner = true
    }
    return { type, val, scope, interfaceScope, scopeOwner }
  }

  private endOfInterfaceScopeOwner(context: InterfaceContext) {
    const { interfaceScope: scope, type, val } = context

    if (!this.options.acceptAdditionalProperties && !scope.firstInvalid && scope.remainingPropNames.size > 0) {
      const cause = `Unexpected properties: ${Array.from(scope.remainingPropNames).join(", ")}`
      scope.firstInvalid = { valid: false, unmatchs: [{ type, val, cause }] }
    }

    if (scope.firstInvalid) {
      const last = scope.firstInvalid.unmatchs[scope.firstInvalid.unmatchs.length - 1]
      const total = scope.validPropCount + scope.invalidPropCount + scope.remainingPropNames.size
      last.score = total === 0 ? 0 : scope.validPropCount / total
    }
  }

  private checkIndexSignature(indexSignature: IndexSignature, context: InterfaceContext) {
    const { val, interfaceScope } = context
    for (const [propName, childVal] of Object.entries(val)) {
      let valid = true
      if (indexSignature.keyType === "number" && isNaN(Number(propName))) {
        if (!interfaceScope.firstInvalid) {
          const cause = `Property name ${propName} is not a number`
          interfaceScope.firstInvalid = { valid: false, unmatchs: [{ type: indexSignature.of, val, cause }] }
        }
        valid = false
      }
      const result = this.checkType(indexSignature.type, childVal, () => `property '${propName}' (from index signature)`)
      if (!result.valid) {
        if (!interfaceScope.firstInvalid) {
          result.unmatchs.push({ type: indexSignature.of, val })
          interfaceScope.firstInvalid = result
        }
        valid = false
      }
      if (valid)
        ++interfaceScope.validPropCount
      else
        ++interfaceScope.invalidPropCount
      interfaceScope.remainingPropNames.delete(propName)
    }
  }

  private checkProperties(properties: Properties, context: InterfaceContext) {
    const { val, interfaceScope } = context
    for (const property of Object.values(properties)) {
      const result = this.checkProperty(property, val)
      if (!result.valid) {
        if (!interfaceScope.firstInvalid)
          interfaceScope.firstInvalid = result
        ++interfaceScope.invalidPropCount
      } else
        ++interfaceScope.validPropCount
      interfaceScope.remainingPropNames.delete(property.name)
    }
  }

  private checkProperty(property: Property, val: object): InternalResult {
    const prop = val[property.name]
    if (prop === undefined) {
      if (!property.optional) {
        const cause = `Missing property '${property.name}'`
        return { valid: false, unmatchs: [{ type: property.of, val, cause }] }
      }
    } else {
      const childResult = this.checkType(property.type, prop, () => `property '${property.name}'`)
      if (!childResult.valid) {
        childResult.unmatchs.push({ type: property.of, val })
        return childResult
      }
    }
    return { valid: true }
  }

  private checkLiteralType(type: LiteralType, val: unknown): InternalResult {
    if (type.literal !== val)
      return { valid: false, unmatchs: [{ type, val }] }
    return { valid: true }
  }

  private checkArrayType(type: ArrayType, val: unknown): InternalResult {
    if (!Array.isArray(val)) {
      const cause = "is not an array"
      return { valid: false, unmatchs: [{ type, val, cause }] }
    }

    for (const [index, item] of (val as unknown[]).entries()) {
      const childResult = this.checkType(type.itemType, item, () => `array item ${index}`)
      if (!childResult.valid) {
        childResult.unmatchs.push({ type, val })
        return childResult
      }
    }
    return { valid: true }
  }

  private checkTupleType(type: TupleType, val: unknown): InternalResult {
    if (!Array.isArray(val)) {
      const cause = "is not an array"
      return { valid: false, unmatchs: [{ type, val, cause }] }
    }

    const items = type.itemTypes
    if (val.length !== items.length) {
      const cause = `expected tuple size ${items.length}, received: '${val.length}'`
      return { valid: false, unmatchs: [{ type, val, cause }] }
    }

    for (const [index, item] of items.entries()) {
      const prop = val[index]
      const childResult = this.checkType(item, prop, () => `tuple item ${index}`)
      if (!childResult.valid) {
        childResult.unmatchs.push({ type, val })
        return childResult
      }
    }

    return { valid: true }
  }

  private checkCompositeType(type: CompositeType, val: unknown, scope: Scope | undefined): InternalResult {
    if (type.op === "union")
      return this.checkCompositeUnion(type, val)
    else
      return this.checkCompositeIntersection(type, val, scope)
  }

  private checkCompositeUnion(type: CompositeType, val: unknown): InternalResult {
    let bestInvalid: InternalInvalidResult | undefined
    let bestInvalidScore = 0
    for (const itemType of type.types) {
      const result = this.checkType(itemType, val)
      if (result.valid)
        return { valid: true }
      const last = result.unmatchs[result.unmatchs.length - 1]
      if (last.score && last.score > bestInvalidScore) {
        bestInvalid = result
        bestInvalidScore = last.score
      }
    }

    const cause = `no matching type in: ${type.types.map(typeAsString).join(" | ")}`
    if (bestInvalid) {
      bestInvalid.unmatchs.push({ type, val, cause })
      return bestInvalid
    } else
      return { valid: false, unmatchs: [{ type, val, cause }] }
  }

  private checkCompositeIntersection(type: CompositeType, val: unknown, scope: Scope | undefined): InternalResult {
    const context = (val && typeof val === "object")
      ? this.makeInterfaceContext(type, val as object, scope)
      : undefined

    for (const itemType of type.types) {
      const result = this.checkType(itemType, val, () => `intersection type`, (context && context.scope) || scope)
      if (!result.valid && (!context || !context.interfaceScope.firstInvalid)) {
        const score = result.unmatchs[result.unmatchs.length - 1].score
        result.unmatchs.push({ type, val, score })
        return result
      }
    }

    if (context) {
      if (context.scopeOwner)
        this.endOfInterfaceScopeOwner(context)
      if (context.scopeOwner && context.interfaceScope.firstInvalid)
        return context.interfaceScope.firstInvalid
    }

    return { valid: true }
  }

  private checkKeyofType(type: KeyofType, val: unknown): InternalResult {
    return this.checkKeyofTypeWith(type.type, val)
  }

  private checkKeyofTypeWith(type: Type, val: unknown): InternalResult {
    if (type.kind === "interface") {
      if (type.indexSignature) {
        if (type.indexSignature.keyType === typeof val)
          return { valid: true }
      }
      if (type.mappedIndexSignature) {
        throw new Error(`Keyof interface with mappedIndexSignature not yet implemented`)
      }
      for (const propertyName of Object.keys(type.properties || {})) {
        if (propertyName === val)
          return { valid: true }
      }
      return { valid: false, unmatchs: [{ type, val }] }
    }

    if (type.kind === "array" || type.kind === "tuple"
      || (type.kind === "literal" && typeof type.literal === "string")) {
      if (isNaN(Number(val))) {
        const cause = `is not a number`
        return { valid: false, unmatchs: [{ type, val, cause }] }
      }
      return { valid: true }
    }

    if (type.kind === "localRef" || type.kind === "importedRef")
      return this.checkKeyofTypeWith(type.ref, val)

    if (type.kind === "composite") {
      if (type.op !== "intersection")
        throw new Error(`Cannot use keyof on a union type.`)
      for (const itemType of type.types) {
        if (this.checkKeyofTypeWith(itemType, val).valid)
          return { valid: true }
      }
      return { valid: false, unmatchs: [{ type, val }] }
    }

    throw new Error(`Cannot use keyof on: ${type.kind}.`)
  }

  private checkLocalTypeRef(type: LocalTypeRef, val: unknown, scope: Scope | undefined): InternalResult {
    return this.checkType(type.ref, val, () => `type '${type.refName}'`, scope)
  }

  private checkImportedTypeRef(type: ImportedTypeRef, val: unknown, scope: Scope | undefined): InternalResult {
    return this.checkType(type.ref, val, () => `imported type '${type.refName}'`, scope)
  }

  private checkMemberType(type: MemberType, val: unknown): InternalResult {

    return this.checkMemberTypeWith(type.parentType, val, type.memberName)
  }

  private checkMemberTypeWith(type: Type, val: unknown, memberName: string | MemberNameLiteral): InternalResult {
    if (typeof memberName === "string")
      throw new Error(`Generic parameter name not implemented as member name`)

    const literalType = typeof memberName.literal
    if (literalType !== "string" && literalType !== "number")
      throw new Error(`Cannot use a ${literalType} literal as a member name`)
    const name = memberName.literal

    if (type.kind === "interface") {
      const memberType = (type.properties || {})[name]
      if (!memberType)
        throw new Error(`Missing member '${name}' in interface`)
      return this.checkType(memberType.type, val, () => `property '${name}'`)
    }

    if (type.kind === "array") {
      if (typeof name !== "number")
        throw new Error(`Cannot use a member type on array with a string literal '${name}'`)
      return this.checkType(type.itemType, val, () => `array item ${name}`)
    }
    if (type.kind === "tuple") {
      if (typeof name !== "number")
        throw new Error(`Cannot use a member type on tuple with a string literal '${name}'`)
      const memberType = type.itemTypes[name]
      if (!memberType)
        throw new Error(`Missing member '${name}' in tuple`)
      return this.checkType(memberType, val, () => `tuple item ${name}`)
    }

    if (type.kind === "localRef" || type.kind === "importedRef") {
      return this.checkMemberTypeWith(type.ref, val, memberName)
    }

    if (type.kind === "composite") {
      if (type.op !== "intersection")
        throw new Error(`Cannot use member type on a union type.`)
      for (const itemType of type.types) {
        if (this.checkMemberTypeWith(itemType, val, memberName).valid)
          return { valid: true }
      }
      return { valid: false, unmatchs: [{ type, val }] }
    }

    throw new Error(`Cannot use member type of: ${type.kind}.`)
  }

  private checkFunctionType(type: FunctionType, val: unknown): InternalResult {
    if (typeof val === "function")
      return { valid: true }
    const cause = `is not a function.`
    return { valid: false, unmatchs: [{ type, val, cause }] }
  }

  private checkGenericInstance(type: GenericInstance, val: unknown): InternalResult {
    // TODO checkGenericInstance
    throw new Error("Checking of generic instance is not implemented.")
  }

  private checkGenericParameterName(type: GenericParameterName, val: unknown): InternalResult {
    // TODO checkGenericParameterName
    throw new Error("Checking of generic parameter name is not implemented.")
  }
}
