import { AstTypeDeclaration } from "../src/ast"
import { parseTypeOnlyToAst } from "../src/parse-typeonly"

describe("AST Specification for Literal Types", () => {

  const validLiterals = [`"abc"`, `"a\\"b"`, `'a\\'b'`, `23n`, `12`, `2.3`, `false`, `true`]
  validLiterals.forEach(literal => {
    test(`valid literal: ${literal}`, () => {
      const input = `type T1 = ${literal}`
      const ast = parseTypeOnlyToAst(input)
      const typeDecl = ast.declarations[0] as AstTypeDeclaration
      expect(typeDecl.type).toEqual({
        whichType: "literal",
        // tslint:disable-next-line: no-eval
        value: eval(literal)
      })
    })
  })
})
