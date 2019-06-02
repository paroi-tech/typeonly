import { parseTypeOnly } from "../../src/api"
import { AstNamedType } from "../../src/ast"

describe("AST Specification for InlineImport", () => {

  test("a InlineImport", () => {
    const source = `
    type T1 = import("./abc").Test
`
    const ast = parseTypeOnly({ source })
    const namedType = ast.declarations![0] as AstNamedType
    expect(namedType.name).toBe("T1")
    expect(namedType.type).toEqual({
      whichType: "inlineImport",
      from: "./abc",
      exportedName: "Test"
    })
  })
})