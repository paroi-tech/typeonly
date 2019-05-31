import { AstArrayType, AstCompositeType, AstFunctionProperty, AstInterface, AstLiteralType, AstNamedType, AstProperty, AstTupleType, AstType, TypeOnlyAst } from "../ast"

export interface CheckResult {
  valid: boolean
  error?: string
}

export default class Checker {
  private lastError?: string
  constructor(private ast: TypeOnlyAst) {
  }

  check(typeName: string, val: unknown): CheckResult {
    try {
      const namedType = this.findNamedType(typeName)
      if (!namedType)
        throw new Error(`Unknown type: ${typeName}`)
      const valid = this.checkType(namedType.type, val)

      if (valid) {
        if (this.lastError) {
          console.log("df1")
          throw new Error(`Check is valid but with an error message: ${this.lastError}`)
        }
        return { valid: true }
      }
      if (!this.lastError)
        throw new Error(`Missing error message`)
      return {
        valid: false,
        error: this.lastError
      }
    } catch (error) {
      return {
        valid: false,
        error: error.message
      }
    }
  }

  private checkType(type: AstType, val: unknown): boolean {
    if (typeof type === "string") {
      if (isPrimitive(type)) {
        if (typeof val !== type) {
          this.lastError = `Expected type ${type}, received: '${typeof val}'.`
          return false
        }
        return true
      } else {
        const namedType = this.findNamedType(type)
        if (!namedType)
          throw new Error(`Unknown type: ${type}`)
        return this.checkType(namedType.type, val)
      }
    }
    if (type.whichType === "interface")
      return this.checkInterface(type, val)
    else if (type.whichType === "literal")
      return this.checkLiteralType(type, val)
    else if (type.whichType === "array")
      return this.checkArrayType(type, val)
    else if (type.whichType === "tuple")
      return this.checkTupleType(type, val)
    else if (type.whichType === "composite") {
      return this.checkCompositeType(type, val)
    } else
      throw new Error(`Unexpected whichType: ${type.whichType}`)
  }

  private findNamedType(typeName: string): AstNamedType | undefined {
    const namedType = this.ast.declarations!.find(
      decl => decl.whichDeclaration === "type" && decl.name === typeName
    )
    return namedType as AstNamedType
  }

  private checkInterface(type: AstInterface, val: unknown): boolean {
    if (!val || typeof val !== "object") {
      this.lastError = `Expected type object, received: '${typeof val}'.`
      return false
    }

    const obj = val as object
    const entries = type.entries || []
    const remaining = new Set(Object.keys(obj))
    for (const entry of entries) {
      if (entry.whichEntry === "comment")
        continue
      if (entry.whichEntry === "property" || entry.whichEntry === "functionProperty") {
        remaining.delete(entry.name)
        const prop = obj[entry.name]
        if (prop === undefined) {
          if (!entry.optional) {
            this.lastError = `Required property '${entry.name}'`
            return false
          }
        } else if (entry.whichEntry === "property")
          this.checkType(entry.type, prop)
        else
          throw new Error(`functionProperty not implemented`)
      } else
        throw new Error(`Unexpected whichEntry: ${entry.whichEntry}`)
    }

    if (remaining.size > 0) {
      this.lastError = `Unexpected properties: ${Array.from(remaining.values()).join(", ")}`
      return false
    }

    return true
  }

  private checkLiteralType(type: AstLiteralType, val: unknown): boolean {
    if (type.literal !== val) {
      this.lastError = `Expected type '${type.literal}', received: '${val}'.`
      return false
    }
    return true
  }

  private checkArrayType(type: AstArrayType, val: unknown): boolean {
    if (!Array.isArray(val)) {
      this.lastError = `Expected type 'Array', received: '${typeof val}'.`
      return false
    }
    const items = val
    for (const item of items) {
      if (!this.checkType(type.itemType, item))
        return false
    }
    return true
  }

  private checkTupleType(type: AstTupleType, val: unknown): boolean {
    // console.log(val)
    // console.log(type)
    if (!Array.isArray(val)) {
      this.lastError = `Expected type 'Array', received: '${typeof val}'.`
      return false
    }
    const items = type.itemTypes || []
    if (val.length !== items.length) {
      this.lastError = `Invalid tuple size: expected ${items.length}, received: '${val.length}'.`
      return false
    }

    for (const [index, item] of items.entries()) {
      const prop = val[index]
      if (!this.checkType(item, prop))
        return false
    }
    return true
  }

  private checkCompositeType(type: AstCompositeType, val: unknown): boolean {
    // console.log(val)
    // console.log(type)

    if (type.op === "union") {
      for (const itemType of type.types) {
        if (this.checkType(itemType, val)) {
          this.lastError = undefined
          return true
        }
      }
      this.lastError = `Expected types '${Array.from(type.types.values()).join(" or ")}', received: '${typeof val}'.`
      return false

    } else {

      this.lastError = `Expected types '${type.types}', received: '${typeof val}'.`
      return false
    }



  }

}

function isPrimitive(str: string): boolean {
  return ["string", "number", "boolean", "bigint"].includes(str)
}
