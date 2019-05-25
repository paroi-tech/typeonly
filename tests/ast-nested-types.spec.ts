import { AstInterface, AstNamedInterface, AstProperty } from "../src/ast"
import { parseTypeOnlyToAst } from "../src/parse-typeonly"

describe("AST Specification for Nested Types", () => {
  test("an anonymous interface nested in a interface", () => {
    const input = `
interface I1 {
  a: {
    b: string
  }
}
      `
    const ast = parseTypeOnlyToAst(input)
    expect(ast.declarations.length).toBe(1)
    const namedInterface = ast.declarations![0] as AstNamedInterface
    expect(namedInterface.whichType).toBe("interface")
    expect(namedInterface.entries!.length).toBe(1)
    const property = namedInterface.entries![0] as AstProperty
    expect(property.whichEntry).toBe("property")
    expect(property.name).toBe("a")
    const subType = property.type as AstInterface
    expect(subType.whichType).toBe("interface")
    expect(subType.entries!.length).toBe(1)
    const subProperty = subType.entries![0] as AstProperty
    expect(subProperty.whichEntry).toBe("property")
    expect(subProperty.name).toBe("b")
    expect(subProperty.type).toBe("string")
  })

  const deep = Math.round(Math.random() * 20)
  test(`a random number of nested interfaces (${deep})`, () => {
    const makeInterface = (deep: number) => {
      if (deep <= 0)
        return "number"
      return `{ a: ${makeInterface(deep - 1)} }`
    }
    const input = `interface I1 ${makeInterface(deep)}`
    const ast = parseTypeOnlyToAst(input)
    let parent = ast.declarations![0] as AstInterface
    for (let i = 0; i < deep - 1; ++i) {
      const child = parent.entries![0] as AstProperty
      parent = child.type as AstInterface
      expect(typeof parent).toBe("object")
      expect(parent.whichType).toBe("interface")
    }
    const child = parent.entries![0] as AstProperty
    expect(child.type).toBe("number")
  })
})
