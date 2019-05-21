import { AstNamedType } from "../src/ast"
import { parseTypeOnlyToAst } from "../src/parse-typeonly"

const stringDelim = ["'", "`", "\""]

describe("AST Specification for Literal Types", () => {


  const validStringLiterals = [`"abc"`, `"a\\"b"`, `'a\\'b'`]
  validStringLiterals.forEach(literal => {
    test(`valid string literal: ${literal}`, () => {
      const input = `type T1 = ${literal}`
      const ast = parseTypeOnlyToAst(input)
      const namedType = ast.declarations[0] as AstNamedType
      expect(namedType.type).toEqual({
        whichType: "literal",
        value: eval(literal),
        stringDelim: literal[0]
      })
    })
  })

  const validLiterals = [`23n`, `12`, `2.3`, `false`, `true`]
  validLiterals.forEach(literal => {
    test(`valid literal: ${literal}`, () => {
      const input = `type T1 = ${literal}`
      const ast = parseTypeOnlyToAst(input)
      const namedType = ast.declarations[0] as AstNamedType
      expect(namedType.type).toEqual({
        whichType: "literal",
        // tslint:disable-next-line: no-eval
        value: eval(literal),
      })
    })
  })
})
