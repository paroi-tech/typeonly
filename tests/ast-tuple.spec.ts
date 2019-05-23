import { AstInterface, AstNamedInterface, AstNamedType, AstProperty, AstTupleType } from "../src/ast"
import { parseTypeOnlyToAst } from "../src/parse-typeonly"

describe("AST Specification for Tuples", () => {

  test("a tuple with identifiers", () => {
    const input = `
type T1 = [string, number, boolean]
`
    const ast = parseTypeOnlyToAst(input)
    const namedType = ast.declarations[0] as AstNamedType
    expect(namedType.name).toBe("T1")
    expect(namedType.type).toEqual({
      whichType: "tuple",
      itemTypes: ["string", "number", "boolean"]
    })
  })

  test("NamedType which has tuple which has identifier and interface as itemTypes", () => {
    const input = `
type T2 = [string, {a: number, b: string}, boolean]
`
    const ast = parseTypeOnlyToAst(input)
    const namedType = ast.declarations[0] as AstNamedType
    expect(namedType.name).toBe("T2")
    expect(namedType.type).toEqual({
      whichType: "tuple",
      itemTypes: ["string",
        {
          whichType: "interface",
          entries: [
            {
              whichEntry: "property",
              name: "a",
              optional: false,
              readonly: false,
              type: "number"
            },
            {
              whichEntry: "property",
              name: "b",
              optional: false,
              readonly: false,
              type: "string"
            }
          ]
        },
        "boolean"]
    })
  })

  test("NamedType which has tuple as Type which has itemTypes separated by comma or newline or comma an newline", () => {
    const input = `
type T3 = [string, number,boolean
  dfdfd]
`
    const ast = parseTypeOnlyToAst(input)
    const namedType = ast.declarations[0] as AstNamedType
    expect(namedType.name).toBe("T3")
    expect(namedType.type).toEqual({
      whichType: "tuple",
      itemTypes: ["string", "number", "boolean", "dfdfd"]
    })
  })


})
