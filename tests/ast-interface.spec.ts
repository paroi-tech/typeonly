import { AstNamedInterface, AstProperty } from "../src/ast"
import { parseTypeOnlyToAst } from "../src/parse-typeonly"

describe("AST Specification for Interfaces", () => {
  const validIdentifiers = ["Abc12", "$_ab12", "_", "$", "əe"]
  validIdentifiers.forEach(identifier => {
    test(`valid identifier: ${identifier}`, () => {
      const input = `interface ${identifier} {}`
      const ast = parseTypeOnlyToAst(input)
      const namedInterface = ast.declarations![0] as AstNamedInterface
      expect(namedInterface.name).toBe(identifier)
    })
  })

  const invalidIdentifiers = ["2b", "a-b", "if", "for", "while", "do", "break", "continue"]
  invalidIdentifiers.forEach(identifier => {
    test(`invalid identifier: ${identifier}`, () => {
      const input = `interface ${identifier} {}`
      expect(() => parseTypeOnlyToAst(input)).toThrow()
    })
  })

  test("declarations can be separated with semicolon or newline or nothing", () => {
    const input = `
interface I1 {}interface I2{} interface I3{}
interface I4{}; interface I5{};
 interface I6{}
      `
    const ast = parseTypeOnlyToAst(input)
    expect(ast.declarations!.length).toBe(6)
  })

  test("property separator can be a coma, a semicolon or a new line", () => {
    const input = `
interface I1 {
  a: string,
  b: string;
  c: string
  d: string
}
`
    const ast = parseTypeOnlyToAst(input)
    const namedInterface = ast.declarations![0] as AstNamedInterface
    expect(namedInterface.entries!.length).toBe(4)
  })

  test("inline interface", () => {
    const input = `
interface I1 { a: string, b: string; c: string }
`
    const ast = parseTypeOnlyToAst(input)
    const namedInterface = ast.declarations![0] as AstNamedInterface
    expect(namedInterface.entries!.length).toBe(3)
  })

  const validTypeNames = {
    "primitive": ["number", "string", "boolean", "bigint"],
    "standard": ["Number", "String", "Boolean", "Bigint", "Date", "Symbol"],
    "typescript": ["any", "void", "object", "unknown", "never"],
    "identifier": validIdentifiers,
  }
  Object.entries(validTypeNames).forEach(([category, typeNames]) => {
    for (const typeName of typeNames) {
      test(`${category} type: ${typeName}`, () => {
        const input = `interface I1 {
          a: ${typeName}
        }`
        const ast = parseTypeOnlyToAst(input)
        const namedInterface = ast.declarations![0] as AstNamedInterface
        const property = namedInterface.entries![0] as AstProperty
        expect(property.type).toBe(typeName)
      })
    }
  })

  test("extends", () => {
    const input = `
interface I1 extends I2, I3 {
  a: number
}
      `
    const ast = parseTypeOnlyToAst(input)
    const namedInterface = ast.declarations![0] as AstNamedInterface
    expect(namedInterface.extends).toEqual(["I2", "I3"])
  })

  test("interface with optional property", () => {
    const input = `
interface I1 {
  a?: number
}
      `
    const ast = parseTypeOnlyToAst(input)
    const namedInterface = ast.declarations![0] as AstNamedInterface
    const prop = namedInterface.entries![0] as AstProperty
    expect(prop.optional).toBe(true)
  })
})
