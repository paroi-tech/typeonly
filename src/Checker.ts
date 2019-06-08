import { ArrayType, CompositeType, FunctionType, GenericInstance, GenericParameterName, ImportedTypeRef, IndexSignature, Interface, KeyofType, LiteralType, LocalTypeRef, MemberNameLiteral, MemberType, Modules, Property, TupleType, Type, TypeName } from "@typeonly/reader"
import { TypeOnlyChecker } from "./api"
import { makeErrorMessage, typeAsString } from "./error-message"

export interface CheckResult {
  conform: boolean
  error?: string
}

type InternalResult = { conform: true, unmatch?: undefined } | {
  conform: false
  unmatchs: Unmatch[]
}

export interface Unmatch {
  val: unknown
  type: Type
  cause?: string
  parentContextMsg?: string
}

export default class Checker implements TypeOnlyChecker {
  private typeCheckers: {
    [K in Type["kind"]]: (type: any, val: unknown) => InternalResult
  } = {
      name: (type, val) => this.checkTypeName(type, val),
      interface: (type, val) => this.checkInterface(type, val),
      array: (type, val) => this.checkArrayType(type, val),
      composite: (type, val) => this.checkCompositeType(type, val),
      function: (type, val) => this.checkFunctionType(type, val),
      genericInstance: (type, val) => this.checkGenericInstance(type, val),
      genericParameterName: (type, val) => this.checkGenericParameterName(type, val),
      importedRef: (type, val) => this.checkImportedTypeRef(type, val),
      keyof: (type, val) => this.checkKeyofType(type, val),
      literal: (type, val) => this.checkLiteralType(type, val),
      localRef: (type, val) => this.checkLocalTypeRef(type, val),
      member: (type, val) => this.checkMemberType(type, val),
      tuple: (type, val) => this.checkTupleType(type, val),
    }

  constructor(private modules: Modules) {
  }

  check(moduleName: string, typeName: string, val: unknown): CheckResult {
    const module = this.modules[moduleName]
    if (!module)
      throw new Error(`Unknown module: ${moduleName}`)
    const namedType = module.namedTypes[typeName]
    if (!namedType || !namedType.exported)
      throw new Error(`Module '${moduleName}' has no exported type: ${typeName}`)
    const result = this.checkType(namedType, val)

    if (result.conform)
      return { conform: true }

    return {
      conform: false,
      error: makeErrorMessage(result.unmatchs)
    }
  }

  private checkType(type: Type, val: unknown, parentContextMessage?: () => string): InternalResult {
    const checker = this.typeCheckers[type.kind]
    if (!checker)
      throw new Error(`Unexpected kind: ${type.kind}`)
    const result = checker(type, val)
    if (!result.conform && parentContextMessage) {
      const last = result.unmatchs[result.unmatchs.length - 1]
      if (last)
        last.parentContextMsg = parentContextMessage()
    }
    return result
  }

  private checkTypeName(type: TypeName, val: unknown): InternalResult {
    if (type.group === "primitive") {
      if (typeof val !== type.refName) {
        return { conform: false, unmatchs: [{ type, val }] }
      }
      return { conform: true }
    }

    if (type.group === "ts") {
      if (type.refName === "object" && typeof val !== "object") {
        return { conform: false, unmatchs: [{ type, val }] }
      }
      if (type.refName === "void" && typeof val !== undefined) {
        return { conform: false, unmatchs: [{ type, val }] }
      }
      if (type.refName === "never") {
        return { conform: false, unmatchs: [{ type, val }] }
      }

      return { conform: true }
    }

    if (type.group === "standard")
      throw new Error(`Standard not yet implemented.`)

    if (type.group === "global")
      throw new Error(`Global type not yet implemented.`)

    throw new Error(`Unexpected group: ${type.group}.`)
  }

  private checkInterface(type: Interface, val: unknown): InternalResult {
    if (!val || typeof val !== "object") {
      return { conform: false, unmatchs: [{ type, val }] }
    }
    const obj = val as object

    if (type.indexSignature) {
      const result = this.checkIndexSignature(type.indexSignature, obj)
      if (!result.conform)
        return result
    }

    if (type.mappedIndexSignature)
      throw new Error(`MappedIndexSignature not yet implemented.`)

    const remaining = new Set(Object.keys(obj))
    for (const property of Object.values(type.properties)) {
      remaining.delete(property.name)
      const result = this.checkProperty(property, obj)
      if (!result.conform)
        return result
    }

    // if (remaining.size > 0) {
    //   const cause = `Unexpected properties: ${Array.from(remaining.values()).join(", ")}`
    //   return { conform: false, unmatchs: [{ type, val, cause }] }
    // }

    return { conform: true }
  }

  private checkProperty(property: Property, obj: object): InternalResult {
    const prop = obj[property.name]
    if (prop === undefined) {
      if (!property.optional) {
        const cause = `Missing property '${property.name}'`
        return { conform: false, unmatchs: [{ type: property.of, val: obj, cause }] }
      }
    } else {
      const childResult = this.checkType(property.type, prop, () => `property '${property.name}'`)
      if (!childResult.conform) {
        childResult.unmatchs.push({ type: property.of, val: obj })
        return childResult
      }
    }
    return { conform: true }
  }

  private checkIndexSignature(indexSignature: IndexSignature, obj: object): InternalResult {
    for (const [propName, childVal] of Object.entries(obj)) {
      if (indexSignature.keyType === "number" && isNaN(Number(propName))) {
        const cause = `Property name ${propName} is not a number`
        return { conform: false, unmatchs: [{ type: indexSignature.of, val: obj, cause }] }
      }
      const result = this.checkType(indexSignature.type, childVal, () => `property '${propName}' (from index signature)`)
      if (!result.conform) {
        result.unmatchs.push({ type: indexSignature.of, val: obj })
        return result
      }
    }
    return { conform: true }
  }

  private checkLiteralType(type: LiteralType, val: unknown): InternalResult {
    if (type.literal !== val)
      return { conform: false, unmatchs: [{ type, val }] }
    return { conform: true }
  }

  private checkArrayType(type: ArrayType, val: unknown): InternalResult {
    if (!Array.isArray(val)) {
      const cause = "is not an array"
      return { conform: false, unmatchs: [{ type, val, cause }] }
    }

    for (const [index, item] of (val as unknown[]).entries()) {
      const childResult = this.checkType(type.itemType, item, () => `array item ${index}`)
      if (!childResult.conform) {
        childResult.unmatchs.push({ type, val })
        return childResult
      }
    }
    return { conform: true }
  }

  private checkTupleType(type: TupleType, val: unknown): InternalResult {
    if (!Array.isArray(val)) {
      const cause = "is not an array"
      return { conform: false, unmatchs: [{ type, val, cause }] }
    }

    const items = type.itemTypes
    if (val.length !== items.length) {
      const cause = `expected tuple size ${items.length}, received: '${val.length}'`
      return { conform: false, unmatchs: [{ type, val, cause }] }
    }

    for (const [index, item] of items.entries()) {
      const prop = val[index]
      const childResult = this.checkType(item, prop, () => `tuple item ${index}`)
      if (!childResult.conform) {
        childResult.unmatchs.push({ type, val })
        return childResult
      }
    }

    return { conform: true }
  }

  private checkCompositeType(type: CompositeType, val: unknown): InternalResult {
    if (type.op === "union") {
      for (const itemType of type.types) {
        if (this.checkType(itemType, val).conform)
          return { conform: true }
      }
      const cause = `no matching type in: ${type.types.map(typeAsString).join(" or ")}`
      return { conform: false, unmatchs: [{ type, val, cause }] }
    } else {
      for (const itemType of type.types) {
        const result = this.checkType(itemType, val, () => `intersection type`)
        if (!result.conform) {
          result.unmatchs.push({ type, val })
          return result
        }
      }
      return { conform: true }
    }
  }

  private checkKeyofType(type: KeyofType, val: unknown): InternalResult {
    return this.checkKeyofTypeWith(type.type, val)
  }

  private checkKeyofTypeWith(type: Type, val: unknown): InternalResult {
    if (type.kind === "interface") {
      if (type.indexSignature) {
        if (type.indexSignature.keyType === typeof val)
          return { conform: true }
      }
      if (type.mappedIndexSignature) {
        throw new Error(`Keyof interface with mappedIndexSignature not yet implemented`)
      }
      for (const propertyName of Object.keys(type.properties)) {
        if (propertyName === val)
          return { conform: true }
      }
      return { conform: false, unmatchs: [{ type, val }] }
    }

    if (type.kind === "array" || type.kind === "tuple"
      || (type.kind === "literal" && typeof type.literal === "string")) {
      if (isNaN(Number(val))) {
        const cause = `is not a number`
        return { conform: false, unmatchs: [{ type, val, cause }] }
      }
      return { conform: true }
    }

    if (type.kind === "localRef" || type.kind === "importedRef")
      return this.checkKeyofTypeWith(type.ref, val)

    if (type.kind === "composite") {
      if (type.op !== "intersection")
        throw new Error(`Cannot use keyof on a union type.`)
      for (const itemType of type.types) {
        if (this.checkKeyofTypeWith(itemType, val).conform)
          return { conform: true }
      }
      return { conform: false, unmatchs: [{ type, val }] }
    }

    throw new Error(`Cannot use keyof on: ${type.kind}.`)
  }

  private checkLocalTypeRef(type: LocalTypeRef, val: unknown): InternalResult {
    return this.checkType(type.ref, val, () => `type '${type.refName}'`)
  }

  private checkImportedTypeRef(type: ImportedTypeRef, val: unknown): InternalResult {
    return this.checkType(type.ref, val, () => `imported type '${type.refName}'`)
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
      const memberType = type.properties[name]
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
        if (this.checkMemberTypeWith(itemType, val, memberName).conform)
          return { conform: true }
      }
      return { conform: false, unmatchs: [{ type, val }] }
    }

    throw new Error(`Cannot use member type of: ${type.kind}.`)
  }

  private checkFunctionType(type: FunctionType, val: unknown): InternalResult {
    if (typeof val === "function")
      return { conform: true }
    const cause = `is not a function.`
    return { conform: false, unmatchs: [{ type, val, cause }] }
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
