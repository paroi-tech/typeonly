const primitiveTypeNames = new Set(["boolean", "number", "bigint", "string", "undefined", "symbol"])

export function hasAncestor(val: unknown, ancestorName: string): boolean {
  let obj: object
  if (primitiveTypeNames.has(typeof val) || val === null)
    obj = Object(val)
  else if (typeof val === "function") {
    const name: string = val.name
    if (name === ancestorName)
      return true
    obj = val.prototype
  } else
    obj = val as object

  do {
    if (obj.constructor.name === ancestorName)
      return true
  } while (obj = Object.getPrototypeOf(obj))

  return false
}