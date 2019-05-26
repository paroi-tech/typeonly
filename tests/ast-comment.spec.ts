import { AstNamedType, AstStandaloneComment } from "../src/ast"
import { parseTypeOnlyToAst } from "../src/parse-typeonly"

describe("AST Specification for Comments", () => {

  function testStandaloneComment(input: string, text: string, syntax: "inline" | "classic") {
    test(`standalone comment: ${JSON.stringify(input).replace(/\\n/g, "\u23ce")}`, () => {
      const ast = parseTypeOnlyToAst(input)
      expect(ast.declarations![0]).toEqual({
        whichDeclaration: "comment",
        text,
        syntax
      } as AstStandaloneComment)
    })
  }

  testStandaloneComment("// com 1", "com 1", "inline")
  testStandaloneComment(" \n\n  // com 1  \n   \n  ", "com 1", "inline")
  testStandaloneComment("//\n// com 1\n//", "\ncom 1\n", "inline")

  testStandaloneComment("/* com 1 */", "com 1", "classic")
  testStandaloneComment("/*\n * com 1\n */", "com 1", "classic")
  testStandaloneComment(" \n\n  /* com 1 */  \n   \n  ", "com 1", "classic")
  testStandaloneComment("/*\ncom 1\n*/", "\ncom 1\n", "classic")
  testStandaloneComment("/*\n *\n * com 1\n *\n */", "\ncom 1\n", "classic")

  /*
   * com 1
   */

  //   test("inline comment", () => {
  //     const input = `
  // type T1 = string // C
  // `
  //     const ast = parseTypeOnlyToAst(input)
  //     const namedType = ast.declarations![0] as AstNamedType
  //     expect(namedType.inlineComment).toBe("C")
  //   })
})
