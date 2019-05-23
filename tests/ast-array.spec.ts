import { AstInterface, AstNamedInterface, AstNamedType, AstProperty, AstTupleType } from "../src/ast"
import { parseTypeOnlyToAst } from "../src/parse-typeonly"

describe("AST Specification for Array", () => {

  test("a array with identifier", () => {
    const input = `
type T1 = number[]
`
    const ast = parseTypeOnlyToAst(input)
    const namedType = ast.declarations[0] as AstNamedType
    expect(namedType.name).toBe("T1")
    expect(namedType.type).toEqual({
      whichType: "array",
      itemType: "number"
    })
  })
})