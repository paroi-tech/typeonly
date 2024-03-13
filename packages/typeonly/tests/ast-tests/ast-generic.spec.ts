import { parseTypeOnly } from "../../src/api"
import { AstGenericInstance, AstNamedType } from "../../src/ast"

describe("AST Specification for Generic", () => {

  test("a generic instance with identifier", () => {
    const source = `
type T1 = G<number, string>
`
    const ast = parseTypeOnly({ source })
    const namedType = ast.declarations![0] as AstNamedType
    expect(namedType.name).toBe("T1")
    expect(namedType.type).toEqual({
      whichType: "genericInstance",
      genericName: "G",
      parameterTypes: [
        "number",
        "string"
      ]
    } as AstGenericInstance)
  })
})