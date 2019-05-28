import { AstArrayType, AstCompositeType, AstFunctionType, AstInterface, AstNamedType, AstProperty } from "../src/ast"
import { parseTypeOnlyToAst } from "../src/parser/parse-typeonly"

describe("AST Specification for Precedence", () => {

  test("function with an array as return value", () => {
    const input = `
type T1 = () => A[]
`
    const ast = parseTypeOnlyToAst(input)
    const namedType = ast.declarations![0] as AstNamedType
    const type = namedType.type as AstFunctionType
    expect(type.whichType).toBe("function")
    const returnType = type.returnType as AstArrayType
    expect(returnType.whichType).toBe("array")
    expect(returnType.itemType).toBe("A")
  })

  test("function with a composite type as return value", () => {
    const input = `
type T1 = () => A | B[]
`
    const ast = parseTypeOnlyToAst(input)
    const namedType = ast.declarations![0] as AstNamedType
    const type = namedType.type as AstFunctionType
    expect(type.whichType).toBe("function")
    const returnType = type.returnType as AstCompositeType
    expect(returnType.whichType).toBe("composite")
    expect(returnType.types.length).toBe(2)
    expect(returnType.types[0]).toBe("A")
    const arrayType = returnType.types[1] as AstArrayType
    expect(arrayType.whichType).toBe("array")
    expect(arrayType.itemType).toBe("B")
  })
})