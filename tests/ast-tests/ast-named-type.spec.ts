import { AstInterface, AstNamedType } from "../../src/ast"
import { parseTypeOnlyToAst } from "../../src/parser/parse-typeonly"

describe("AST Specification for Named Types", () => {

  test("type as alias", () => {
    const input = `
type T1 = string
`
    const ast = parseTypeOnlyToAst(input)
    const namedType = ast.declarations![0] as AstNamedType
    expect(namedType.name).toBe("T1")
    expect(namedType.type).toBe("string")
  })

  test("type assign with interface", () => {
    const input = `
type T1 = { a: number }
`
    const ast = parseTypeOnlyToAst(input)
    const namedType = ast.declarations![0] as AstNamedType
    const type = namedType.type as AstInterface
    expect(type.whichType).toBe("interface")
  })
})
