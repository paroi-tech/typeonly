import { AstNamedType } from "../src/ast"
import { parseTypeOnlyToAst } from "../src/parse-typeonly"

describe("AST Specification for Literal Types", () => {

  const validLiterals = [`"abc"`, `"a\\"b"`, `'a\\'b'`, `23n`, `12`, `2.3`, `false`, `true`]
  validLiterals.forEach(literal => {
    test(`valid literal: ${literal}`, () => {
      const input = `type T1 = ${literal}`
      const ast = parseTypeOnlyToAst(input)
      const namedType = ast.declarations[0] as AstNamedType
      expect(namedType.type).toEqual({
        whichType: "literal",
        // tslint:disable-next-line: no-eval
        value: eval(literal)
      })
    })
  })
})
