import { AstIndexSignature, AstMappedIndexSignature, AstNamedInterface } from "../src/ast"
import { parseTypeOnlyToAst } from "../src/parser/parse-typeonly"

describe("AST Specification for Index Signature", () => {

  test("a index signature", () => {
    const input = `interface I1 {
      [index1: string] : {a: number}
    }`
    const ast = parseTypeOnlyToAst(input)
    const namedInterface = ast.declarations![0] as AstNamedInterface
    expect(namedInterface.whichDeclaration).toBe("interface")
    expect(namedInterface.whichType).toBe("interface")
    expect(namedInterface.name).toBe("I1")
    expect(namedInterface.entries).toEqual([
      {
        whichEntry: "indexSignature",
        keyName: "index1",
        keyType: "string",
        optional: false,
        readonly: false,
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
      }
    ])
  })

  test("a mapped index signature", () => {
    const input = `interface I1 {
      [index1 in string] : {a: number}
    }`
    const ast = parseTypeOnlyToAst(input)
    const namedInterface = ast.declarations![0] as AstNamedInterface
    expect(namedInterface.whichDeclaration).toBe("interface")
    expect(namedInterface.whichType).toBe("interface")
    expect(namedInterface.name).toBe("I1")
    expect(namedInterface.entries).toEqual([
      {
        whichEntry: "mappedIndexSignature",
        keyName: "index1",
        optional: false,
        readonly: false,
        keyInType: "string",
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
      }
    ])
  })

})