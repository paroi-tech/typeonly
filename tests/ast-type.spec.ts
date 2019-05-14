import { AstInterface, AstInterfaceDeclaration, AstProperty, AstTypeDeclaration } from "../src/ast"
import { parseTypeOnlyToAst } from "../src/parse-typeonly"

describe("AST Specification for Types", () => {

  test("type as alias", () => {
    const input = `
type T1 = string
`
    const ast = parseTypeOnlyToAst(input)
    const typeDecl = ast.declarations[0] as AstTypeDeclaration
    expect(typeDecl.name).toBe("T1")
    expect(typeDecl.type).toBe("string")
  })

  test("type assign with interface", () => {
    const input = `
type T1 = { a: number }
`
    const ast = parseTypeOnlyToAst(input)
    const typeDecl = ast.declarations[0] as AstTypeDeclaration
    const type = typeDecl.type as AstInterface
    expect(type.whichType).toBe("interface")
  })
})
