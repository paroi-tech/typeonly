import { Type } from "@typeonly/reader"
import { Unmatch } from "./Checker"

export function makeErrorMessage(unmatchs: Unmatch[]): string {
  const messages: string[] = []
  for (const { val, type, cause, parentContextMsg } of unmatchs) {
    let message = `${valueAsString(val)} is not conform to ${typeAsString(type)}`
    if (cause)
      message += `: ${cause}`
    if (parentContextMsg)
      message = `In ${parentContextMsg}, value ${message}`
    else
      message = `Value ${message}`
    message += "."
    messages.push(message)
  }
  messages.reverse()
  return messages.join("\n")
}

function valueAsString(val: unknown): string {
  const t = typeof val
  switch (t) {
    case "string":
      return JSON.stringify(val)
    case "number":
    case "boolean":
      return String(val)
    case "bigint":
      return `${val}n`
    case "object":
      if (val === null)
        return "null"
      return objectAsString(val as object)
    case "function":
    case "symbol":
    case "undefined":
      return t
    default:
      throw new Error(`Unexpected typeof: ${t}`)
  }
}

function objectAsString(obj: object) {
  return `{${Object.entries(obj).map(([key, val]) => {
    const t = typeof val
    if (t === "string")
      return `${key}: ${JSON.stringify(val)}`
    if (t === "number" || t === "bigint" || t === "boolean")
      return `${key}: ${val}`
    return key
  }).join(", ")}}`
}

export function typeAsString(type: Type): string {
  if (type["name"])
    return type["name"]
  switch (type.kind) {
    case "name":
      return type.refName
    case "localRef":
      return type.refName
    case "importedRef":
      return type.refName
    case "array":
      return `${typeAsString(type.itemType)}[]`
    case "tuple":
      return `[${type.itemTypes.map(typeAsString).join(", ")}]`
    case "composite":
      return type.op
    case "function":
    case "genericInstance":
    case "interface":
      return type.kind
    case "genericParameterName":
      return type.genericParameterName
    case "keyof":
      return `keyof ${typeAsString(type.type)}`
    case "literal":
      return JSON.stringify(type.literal)
    case "member":
      const propName = typeof type.memberName !== "string" ? JSON.stringify(type.memberName.literal) : type.memberName
      return `${typeAsString(type.parentType)}[${propName}]`
    default:
      throw new Error(`Unexpected type: ${type!.kind}`)
  }
}