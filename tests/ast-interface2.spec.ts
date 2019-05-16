import { AstFunctionProperty, AstFunctionType, AstInterfaceDeclaration, AstProperty } from "../src/ast"
import { parseTypeOnlyToAst } from "../src/parse-typeonly"

describe("AST Specification for Interfaces (part 2)", () => {
  const testFunctionAsProperty = (input: string, entryType: string, parameters: any[], returnValue: string) => {
    test(`a function as ${entryType}, ${parameters.length === 0 ? "no parameter" : `with ${parameters.length} parameters`}`, () => {
      const ast = parseTypeOnlyToAst(input)
      const interfaceDecl = ast.declarations[0] as AstInterfaceDeclaration
      const prop = interfaceDecl.entries[0] as AstProperty
      expect(prop.entryType).toBe(entryType)
      expect(prop.name).toBe("a")
      const propType = prop.type as AstFunctionType
      expect(propType.whichType).toBe("function")
      expect(propType.parameters).toEqual(parameters)
      expect(propType.returnValue).toBe(returnValue)
    })
  }

  testFunctionAsProperty(`
interface I1 {
  a(): number
}`, "functionProperty", [], "number")

  testFunctionAsProperty(`
interface I1 {
  a: () => number
}`, "property", [], "number")

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

  testFunctionAsProperty(`
interface I1 {
  a(p1: T1, p2: T2): void
}`, "functionProperty", parameters, "void")

  testFunctionAsProperty(`
interface I1 {
  a: (p1: T1, p2: T2) => void
}`, "property", parameters, "void")

})
