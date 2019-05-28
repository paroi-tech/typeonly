import { AstNamedType } from "../src/ast"
import { parseTypeOnlyToAst } from "../src/parse-typeonly"

describe("AST Specification for Generic", () => {

  test("a generic with identifier", () => {
    const input = `
type T1 = G<number, string>
`
    const ast = parseTypeOnlyToAst(input)
    const namedType = ast.declarations![0] as AstNamedType
    expect(namedType.name).toBe("T1")
    expect(namedType.type).toEqual({
      whichType: "generic",
      name: "G",
      parameterTypes: [
        "number",
        "string"
      ]
    })
  })
})