import { AstNamedType, AstStandaloneComment } from "../src/ast"
import { parseTypeOnlyToAst } from "../src/parse-typeonly"

describe("AST Specification for Comments", () => {

  test("standalone comment", () => {
    const input = `
// com 1
`
    const ast = parseTypeOnlyToAst(input)
    expect(ast.declarations![0]).toEqual({
      whichDeclaration: "comment",
      text: "com 1",
      syntax: "inline"
    } as AstStandaloneComment)
  })

  //   test("inline comment", () => {
  //     const input = `
  // type T1 = string // C
  // `
  //     const ast = parseTypeOnlyToAst(input)
  //     const namedType = ast.declarations![0] as AstNamedType
  //     expect(namedType.inlineComment).toBe("C")
  //   })
})
