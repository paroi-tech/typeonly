import { AstNamedType } from "../src/ast"
import { parseTypeOnlyToAst } from "../src/parser/parse-typeonly"

describe("AST Specification for KeyOf", () => {

  test("a keyOf with interface", () => {
    const input = `
    type T1 = keyof {a:number}
`
    const ast = parseTypeOnlyToAst(input)
    const namedType = ast.declarations![0] as AstNamedType
    expect(namedType.name).toBe("T1")
    expect(namedType.type).toEqual({
      whichType: "keyof",
      type: {
        whichType: "interface",
        entries: [
          {
            whichEntry: "property",
            name: "a",
            optional: false,
            readonly: false,
            type: "number"
          }
        ]
      }
    })
  })
})