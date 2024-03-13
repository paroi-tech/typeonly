import { parseTypeOnly } from "../../src/api"
import { AstNamedType } from "../../src/ast"

describe("AST Specification for KeyOf", () => {

  test("a keyOf with interface", () => {
    const source = `
    type T1 = keyof {a:number}
`
    const ast = parseTypeOnly({ source })
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