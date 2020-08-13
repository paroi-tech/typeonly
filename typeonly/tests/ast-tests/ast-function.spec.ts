import { parseTypeOnly } from "../../src/api"
import { AstFunctionType, AstNamedType } from "../../src/ast"

describe("AST Specification for Function Types", () => {
  test(`empty function`, () => {
    const source = `type T1 = () => void`
    const ast = parseTypeOnly({ source })
    const namedType = ast.declarations![0] as AstNamedType
    expect(namedType.type).toEqual({
      whichType: "function",
      returnType: "void"
    } as AstFunctionType)
  })

  test(`function with parameters`, () => {
    const source = `type T1 = (p1: string, p2?: number) => void`
    const ast = parseTypeOnly({ source })
    const namedType = ast.declarations![0] as AstNamedType
    expect(namedType.type).toEqual({
      whichType: "function",
      parameters: [
        {
          name: "p1",
          type: "string",
          optional: false
        },
        {
          name: "p2",
          type: "number",
          optional: true
        },
      ],
      returnType: "void"
    } as AstFunctionType)
  })

  test(`function with nested types`, () => {
    const source = `type T1 = (p1: () => void) => () => void`
    const ast = parseTypeOnly({ source })
    const namedType = ast.declarations![0] as AstNamedType
    const fnType = namedType.type as AstFunctionType
    const emptyFnType: AstFunctionType = {
      whichType: "function",
      returnType: "void"
    }
    expect(fnType.returnType).toEqual(emptyFnType)
    expect(fnType.parameters![0].type).toEqual(emptyFnType)
  })

  test(`function with nested types and parenthesis`, () => {
    const source = `type T1 = (((p1: (() => void)) => (() => void)))`
    const ast = parseTypeOnly({ source })
    const namedType = ast.declarations![0] as AstNamedType
    const fnType = namedType.type as AstFunctionType
    const emptyFnType: AstFunctionType = {
      whichType: "function",
      returnType: "void"
    }
    expect(fnType.returnType).toEqual(emptyFnType)
    expect(fnType.parameters![0].type).toEqual(emptyFnType)
  })
})
