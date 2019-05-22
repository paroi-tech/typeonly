import { AstCompositeType, AstInterface, AstNamedType, AstProperty } from "../src/ast"
import { parseTypeOnlyToAst } from "../src/parse-typeonly"

describe("AST Specification for Composite Types", () => {
  test(`composite type with identifiers`, () => {
    const input = `type T1 = number | string | undefined | null`
    const ast = parseTypeOnlyToAst(input)
    const namedType = ast.declarations[0] as AstNamedType
    const composite = namedType.type as AstCompositeType
    expect(composite).toEqual({
      whichType: "composite",
      op: "union",
      types: ["number", "string", "undefined", "null"]
    } as AstCompositeType)
  })

  test(`composite type with nested types`, () => {
    const input = `type T1 = { a: string | number } & { b: boolean }`
    const ast = parseTypeOnlyToAst(input)
    const namedType = ast.declarations[0] as AstNamedType
    const composite = namedType.type as AstCompositeType
    expect(composite.op).toBe("intersection")

    const t1 = composite.types[0] as AstInterface
    expect(t1.whichType).toBe("interface")
    const t1Prop = (t1.entries[0] as AstProperty).type as AstCompositeType
    expect(t1Prop).toEqual({
      whichType: "composite",
      op: "union",
      types: ["string", "number"]
    } as AstCompositeType)

    const t2 = composite.types[1] as AstInterface
    expect(t2.whichType).toBe("interface")
  })

  const withParenthesis = [
    `A | B & C`,
    `A | (B & C)`,
    `(A) | ((B & C))`,
    `(((A) | ((B & C))))`,
  ]
  withParenthesis.forEach((inputType, index) => {
    test(`composite type with parenthesis #${index + 1}`, () => {
      const ast = parseTypeOnlyToAst(`type T1 = ${inputType}`)
      const namedType = ast.declarations[0] as AstNamedType
      const composite = namedType.type as AstCompositeType
      expect(composite.op).toBe("union")
      expect(composite.types[0]).toBe("A")

      const t2 = composite.types[1] as AstCompositeType
      expect(t2).toEqual({
        whichType: "composite",
        op: "intersection",
        types: ["B", "C"]
      } as AstCompositeType)
    })
  })
})
