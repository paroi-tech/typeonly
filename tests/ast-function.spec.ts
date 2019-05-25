import { AstFunctionType, AstNamedType } from "../src/ast"
import { parseTypeOnlyToAst } from "../src/parse-typeonly"

describe("AST Specification for Function Types", () => {
  test(`empty function`, () => {
    const input = `type T1 = () => void`
    const ast = parseTypeOnlyToAst(input)
    const namedType = ast.declarations![0] as AstNamedType
    expect(namedType.type).toEqual({
      whichType: "function",
      returnType: "void"
    } as AstFunctionType)
  })

  test(`function with parameters`, () => {
    const input = `type T1 = (p1: string, p2: number) => void`
    const ast = parseTypeOnlyToAst(input)
    const namedType = ast.declarations![0] as AstNamedType
    expect(namedType.type).toEqual({
      whichType: "function",
      parameters: [
        {
          name: "p1",
          type: "string",
        },
        {
          name: "p2",
          type: "number",
        },
      ],
      returnType: "void"
    } as AstFunctionType)
  })

  test(`function with nested types`, () => {
    const input = `type T1 = (p1: () => void) => () => void`
    const ast = parseTypeOnlyToAst(input)
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
    const input = `type T1 = (((p1: (() => void)) => (() => void)))`
    const ast = parseTypeOnlyToAst(input)
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
