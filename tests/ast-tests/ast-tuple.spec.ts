import { AstInterface, AstNamedInterface, AstNamedType, AstProperty, AstTupleType } from "../../src/ast"
import { parseTypeOnlyToAst } from "../../src/parser/parse-typeonly"

describe("AST Specification for Tuples", () => {

  test("empty tuple", () => {
    const input = `
type T1 = []
`
    const ast = parseTypeOnlyToAst(input)
    const namedType = ast.declarations![0] as AstNamedType
    expect(namedType.name).toBe("T1")
    expect(namedType.type).toEqual({
      whichType: "tuple"
    })
  })

  test("a tuple with identifiers", () => {
    const input = `
type T1 = [string, number, boolean]
`
    const ast = parseTypeOnlyToAst(input)
    const namedType = ast.declarations![0] as AstNamedType
    expect(namedType.name).toBe("T1")
    expect(namedType.type).toEqual({
      whichType: "tuple",
      itemTypes: ["string", "number", "boolean"]
    })
  })

  test("a tuple with identifiers and an interface", () => {
    const input = `
type T2 = [string, {a: number, b: string}, boolean]
`
    const ast = parseTypeOnlyToAst(input)
    const namedType = ast.declarations![0] as AstNamedType
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

  test("a tuple with a newline", () => {
    const input = `
type T3 = [string, number,boolean
  ,
  dfdfd]
`
    const ast = parseTypeOnlyToAst(input)
    const namedType = ast.declarations![0] as AstNamedType
    expect(namedType.name).toBe("T3")
    expect(namedType.type).toEqual({
      whichType: "tuple",
      itemTypes: ["string", "number", "boolean", "dfdfd"]
    })
  })


})
