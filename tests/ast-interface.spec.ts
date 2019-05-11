import { AstInterfaceDeclaration, AstProperty } from "../src/ast"
import { parseTypeOnlyToAst } from "../src/parse-typeonly"

describe("AST Specification for Interfaces", () => {
  test("weird spaces do not matter", () => {
    const input = `
interface    I1

{

  sd : string

df:string
}

      `
    const ast = parseTypeOnlyToAst(input)
    expect(ast.declarations.length).toBe(1)
  })

  const validIdentifiers = ["Abc12", "$_ab12", "_", "$", "əe"]
  validIdentifiers.forEach(identifier => {
    test(`valid identifier: ${identifier}`, () => {
      const input = `interface ${identifier} {}`
      const ast = parseTypeOnlyToAst(input)
      const interfaceDecl = ast.declarations[0] as AstInterfaceDeclaration
      expect(interfaceDecl.name).toBe(identifier)
    })
  })

  const invalidIdentifiers = ["2b", "a-b"]
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
    expect(ast.declarations.length).toBe(6)
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
    const interfaceDecl = ast.declarations[0] as AstInterfaceDeclaration
    expect(interfaceDecl.entries.length).toBe(4)
  })

  test("inline interface", () => {
    const input = `
interface I1 { a: string, b: string; c: string }
`
    const ast = parseTypeOnlyToAst(input)
    const interfaceDecl = ast.declarations[0] as AstInterfaceDeclaration
    expect(interfaceDecl.entries.length).toBe(3)
  })

  const validTypeNames = {
    "primitive": ["number", "string", "boolean"],
    "standard": ["Number", "String", "Boolean", "Date", "Symbol"],
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
        const interfaceDecl = ast.declarations[0] as AstInterfaceDeclaration
        const property = interfaceDecl.entries[0] as AstProperty
        expect(property.type).toBe(typeName)
      })
    }
  })
})