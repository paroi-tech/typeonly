import { AstFunctionProperty, AstFunctionType, AstNamedInterface, AstProperty } from "../../src/ast"
import { parseTypeOnlyToAst } from "../../src/parser/parse-typeonly"

describe("AST Specification for Interfaces (part 2)", () => {
  const testFunctionAsProperty = (input: string, parameters: any[], returnType: string) => {
    test(`a function as property, ${parameters.length === 0 ? "no parameter" : `with ${parameters.length} parameters`}`, () => {
      const ast = parseTypeOnlyToAst(input)
      const namedInterface = ast.declarations![0] as AstNamedInterface
      const prop = namedInterface.entries![0] as AstProperty
      expect(prop.whichEntry).toBe("property")
      expect(prop.name).toBe("a")
      const propType = prop.type as AstFunctionType
      expect(propType.whichType).toBe("function")
      expect(propType.parameters).toEqual(parameters.length === 0 ? undefined : parameters)
      expect(propType.returnType).toBe(returnType)
    })
  }

  const testFunctionProperty = (input: string, parameters: any[], returnType: string) => {
    test(`a function as functionProperty, ${parameters.length === 0 ? "no parameter" : `with ${parameters.length} parameters`}`, () => {
      const ast = parseTypeOnlyToAst(input)
      const namedInterface = ast.declarations![0] as AstNamedInterface
      const prop = namedInterface.entries![0] as AstFunctionProperty
      expect(prop.whichEntry).toBe("functionProperty")
      expect(prop.name).toBe("a")
      expect(prop.parameters).toEqual(parameters.length === 0 ? undefined : parameters)
      expect(prop.returnType).toBe(returnType)
    })
  }

  testFunctionProperty(`
interface I1 {
  a(): number
}`, [], "number")

  testFunctionAsProperty(`
interface I1 {
  a: () => number
}`, [], "number")

  const parameters = [
    {
      name: "p1",
      type: "T1"
    },
    {
      name: "p2",
      type: "T2"
    }
  ]

  testFunctionProperty(`
interface I1 {
  a(p1: T1, p2: T2): void
}`, parameters, "void")

  testFunctionAsProperty(`
interface I1 {
  a: (p1: T1, p2: T2) => void
}`, parameters, "void")

})
