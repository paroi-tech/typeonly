import { parseTypeOnly } from "../../src/api"
import { AstNamedInterface, AstProperty } from "../../src/ast"

describe("AST Specification for Interfaces", () => {
  const validIdentifiers = ["Abc12", "$_ab12", "_", "$", "əe"]
  validIdentifiers.forEach(identifier => {
    test(`valid identifier: ${identifier}`, () => {
      const source = `interface ${identifier} {}`
      const ast = parseTypeOnly({ source })
      const namedInterface = ast.declarations![0] as AstNamedInterface
      expect(namedInterface.name).toBe(identifier)
    })
  })

  const invalidIdentifiers = ["2b", "a-b", "if", "for", "while", "do", "break", "continue"]
  invalidIdentifiers.forEach(identifier => {
    test(`invalid identifier: ${identifier}`, () => {
      const source = `interface ${identifier} {}`
      expect(() => parseTypeOnly({ source })).toThrow()
    })
  })

  test("declarations can be separated with semicolon or newline or nothing", () => {
    const source = `
interface I1 {}interface I2{} interface I3{}
interface I4{}; interface I5{};
 interface I6{}
      `
    const ast = parseTypeOnly({ source })
    expect(ast.declarations!.length).toBe(6)
  })

  test("property separator can be a coma, a semicolon or a new line", () => {
    const source = `
interface I1 {
  a: string,
  b: string;
  c: string
  d: string
}
`
    const ast = parseTypeOnly({ source })
    const namedInterface = ast.declarations![0] as AstNamedInterface
    expect(namedInterface.entries!.length).toBe(4)
  })

  test("inline interface", () => {
    const source = `
interface I1 { a: string, b: string; c: string }
`
    const ast = parseTypeOnly({ source })
    const namedInterface = ast.declarations![0] as AstNamedInterface
    expect(namedInterface.entries!.length).toBe(3)
  })

  const validTypeNames = {
    "primitive": ["number", "string", "boolean", "bigint", "symbol"],
    "standard": ["Number", "String", "Boolean", "Bigint", "Date", "Symbol"],
    "typescript": ["any", "void", "object", "unknown", "never"],
    "identifier": validIdentifiers,
  }
  Object.entries(validTypeNames).forEach(([category, typeNames]) => {
    for (const typeName of typeNames) {
      test(`${category} type: ${typeName}`, () => {
        const source = `interface I1 {
          a: ${typeName}
        }`
        const ast = parseTypeOnly({ source })
        const namedInterface = ast.declarations![0] as AstNamedInterface
        const property = namedInterface.entries![0] as AstProperty
        expect(property.type).toBe(typeName)
      })
    }
  })

  test("extends", () => {
    const source = `
interface I1 extends I2, I3 {
  a: number
}
      `
    const ast = parseTypeOnly({ source })
    const namedInterface = ast.declarations![0] as AstNamedInterface
    expect(namedInterface.extends).toEqual(["I2", "I3"])
  })

  test("interface with optional property", () => {
    const source = `
interface I1 {
  a?: number
}
      `
    const ast = parseTypeOnly({ source })
    const namedInterface = ast.declarations![0] as AstNamedInterface
    const prop = namedInterface.entries![0] as AstProperty
    expect(prop.optional).toBe(true)
  })
})
