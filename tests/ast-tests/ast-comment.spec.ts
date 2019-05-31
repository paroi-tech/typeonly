import { AstInlineComment, AstNamedInterface, AstNamedType, AstStandaloneComment } from "../../src/ast"
import { parseTypeOnlyToAst } from "../../src/parser/parse-typeonly"

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
  testStandaloneComment("//line 1\n// line 2", "line 1\nline 2", "inline")
  testStandaloneComment("//  line 1\n//  line 2", " line 1\n line 2", "inline")
  testStandaloneComment(" \n\n  // com 1  \n   \n  ", "com 1", "inline")
  testStandaloneComment("//\n// com 1\n//", "\ncom 1\n", "inline")

  testStandaloneComment("/* com 1 */", "com 1", "classic")
  testStandaloneComment("/* line 1\n line 2 */", " line 1\n line 2", "classic")
  testStandaloneComment("/*\n * com 1\n */", "com 1", "classic")
  testStandaloneComment(" \n\n  /* com 1 */  \n   \n  ", "com 1", "classic")
  testStandaloneComment("/*\ncom 1\n*/", "\ncom 1\n", "classic")
  testStandaloneComment("/*\n *\n * com 1\n *\n */", "\ncom 1\n", "classic")

  function testInlineComment(input: string, text: string, syntax: "inline" | "classic") {
    test(`inline comment: ${JSON.stringify(input).replace(/\\n/g, "\u23ce")}`, () => {
      const ast = parseTypeOnlyToAst(input)
      const namedType = ast.declarations![0] as AstNamedType
      expect(namedType.inlineComments).toEqual([
        {
          syntax,
          text
        }
      ] as AstInlineComment[])
    })
  }

  testInlineComment("type T1 = string // com 1", "com 1", "inline")
  testInlineComment("type T1 = string /* com 1 */", "com 1", "classic")
  testInlineComment("type T1 = /* com 1 */ string", "com 1", "classic")
  testInlineComment("type T1 /* com 1 */ = string", "com 1", "classic")
  testInlineComment("type /* com 1 */ T1 = string", "com 1", "classic")

  function testDocCommentOnDeclaration(input: string, text: string) {
    test(`doc comment in declaration: ${JSON.stringify(input).replace(/\\n/g, "\u23ce")}`, () => {
      const ast = parseTypeOnlyToAst(input)
      const decl = ast.declarations![0] as AstNamedType | AstNamedInterface
      expect(decl.docComment).toBe(text)
    })
  }

  function testDocCommentsOnDeclaration(declaration: string) {
    testDocCommentOnDeclaration(`/** com 1 */${declaration}`, "com 1")
    testDocCommentOnDeclaration(`/** com 1 */ ${declaration}`, "com 1")
    testDocCommentOnDeclaration(`/** com 1 */\n${declaration}`, "com 1")
    testDocCommentOnDeclaration(`/** line 1\n line 2 */\n${declaration}`, " line 1\n line 2")
    testDocCommentOnDeclaration(`/**\n * line 1\n * line 2\n */\n${declaration}`, "line 1\nline 2")
  }

  testDocCommentsOnDeclaration("type T1 = string")
  testDocCommentsOnDeclaration("interface I1 {}")

  test(`multiple comments`, () => {
    const input = `
// standalone 1, line 1
// standalone 1, line 2

// standalone 2

/**
 * doc T1
 */
type T1 = A // inline T1

// standalone 3
    `
    const ast = parseTypeOnlyToAst(input)
    expect(ast.declarations![0]).toEqual({
      whichDeclaration: "comment",
      text: "standalone 1, line 1\nstandalone 1, line 2",
      syntax: "inline"
    } as AstStandaloneComment)
    expect(ast.declarations![1]).toEqual({
      whichDeclaration: "comment",
      text: "standalone 2",
      syntax: "inline"
    } as AstStandaloneComment)
    const namedType = ast.declarations![2] as AstNamedType
    expect(namedType.whichDeclaration).toBe("type")
    expect(namedType.docComment).toBe("doc T1")
    expect(namedType.inlineComments).toEqual([
      {
        syntax: "inline",
        text: "inline T1"
      }
    ] as AstInlineComment[])
    expect(ast.declarations![3]).toEqual({
      whichDeclaration: "comment",
      text: "standalone 3",
      syntax: "inline"
    } as AstStandaloneComment)
  })
})
