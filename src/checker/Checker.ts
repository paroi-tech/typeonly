import { AstNamedType, AstType, AstInterface, AstArrayType, AstTupleType, AstLiteralType, AstProperty, AstFunctionProperty, TypeOnlyAst } from "../ast"

export interface CheckResult {
  valid: boolean
  error?: string
}

export default class Checker {
  constructor(private ast: TypeOnlyAst) {
  }

  check(typeName: string, val: unknown): CheckResult {
    try {
      const namedType = this.getNamedType(typeName)
      this.checkType(namedType.type, val)

      return { valid: true }
    } catch (error) {
      return {
        valid: false,
        error: error.message
      }
    }
  }

  private checkType(type: AstType, val: unknown): void {
    if (typeof type === "string") {
      if (isPrimitive(type)) {
        if (typeof val !== type)
          throw new Error(`Expected type ${type}, received: '${typeof val}'.`)
      } else
        this.checkType(this.getNamedType(type).type, val)
    } else {
      if (type.whichType === "interface")
        this.checkInterface(type, val)
      else if (type.whichType === "literal")
        this.checkLiteralType(type, val)
      else if (type.whichType === "array")
        this.checkArrayType(type, val)
      else if (type.whichType === "tuple")
        this.checkTupleType(type, val)
      else
        throw new Error(`Unexpected whichType: ${type.whichType}`)
    }
  }

  private getNamedType(typeName: string): AstNamedType {
    const namedType = this.ast.declarations!.find(
      decl => decl.whichDeclaration === "type" && decl.name === typeName
    )
    if (!namedType)
      throw new Error(`Unknown type: ${typeName}`)
    return namedType as AstNamedType
  }

  private checkInterface(type: AstInterface, val: unknown) {
    if (!val || typeof val !== "object")
      throw new Error(`Expected type object, received: '${typeof val}'.`)
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
          if (!entry.optional)
            throw new Error(`Required property '${entry.name}'`)
        } else if (entry.whichEntry === "property")
          this.checkType(entry.type, prop)
        else
          throw new Error(`functionProperty not implemented`)
      } else
        throw new Error(`Unexpected whichEntry: ${entry.whichEntry}`)
    }

    if (remaining.size > 0)
      throw new Error(`Unexpected properties: ${Array.from(remaining.values()).join(", ")}`)
  }

  private checkLiteralType(type: AstLiteralType, val: unknown) {
    if (type.literal !== val)
      throw new Error(`Expected type '${type.literal}', received: '${val}'.`)
  }

  private checkArrayType(type: AstArrayType, val: unknown) {
    if (Array.isArray(val)) {
      const items = val
      for (const item of items) {
        this.checkType(type.itemType, item)
      }

    } else
      throw new Error(`Expected type 'Array', received: '${typeof val}'.`)
  }

  private checkTupleType(type: AstTupleType, val: unknown) {
    // console.log(val)
    // console.log(type)

    if (Array.isArray(val)) {
      const items = type.itemTypes || []
      const remaining = new Set(val)

      items.forEach((item, index) => {
        remaining.delete(val[index])
        const prop = val[index]
        this.checkType(item, prop)
      })
      if (remaining.size > 0)
        throw new Error(`Unexpected items: ${Array.from(remaining.values()).join(", ")}`)
    } else
      throw new Error(`Expected type 'Array', received: '${typeof val}'.`)
  }

}

function isPrimitive(str: string): boolean {
  return ["string", "number", "boolean", "bigint"].includes(str)
}
