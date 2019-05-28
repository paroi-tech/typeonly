import { AstNamedType } from "../src/ast"
import { parseTypeOnlyToAst } from "../src/parser/parse-typeonly"

describe("AST Specification for InlineImport", () => {

  test("a InlineImport", () => {
    const input = `
    type T1 = import("sddf2122efe").Test
`
    const ast = parseTypeOnlyToAst(input)
    const namedType = ast.declarations![0] as AstNamedType
    expect(namedType.name).toBe("T1")
    expect(namedType.type).toEqual({
      whichType: "inlineImport",
      from: "\"sddf2122efe\"",
      exportedName: "Test"
    })
  })
})