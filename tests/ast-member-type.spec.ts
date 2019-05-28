import { AstNamedType } from "../src/ast"
import { parseTypeOnlyToAst } from "../src/parse-typeonly"

describe("AST Specification for MemberType", () => {

  test("a member type with identifier", () => {
    const input = `
    type T1 = Add[cv]
`
    const ast = parseTypeOnlyToAst(input)
    const namedType = ast.declarations![0] as AstNamedType
    expect(namedType.name).toBe("T1")
    expect(namedType.type).toEqual({
      whichType: "member",
      memberName: "cv",
      type: "Add"
    })
  })
})