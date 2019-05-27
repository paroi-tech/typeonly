import { AstClassicImport, AstNamespacedImport } from "../src/ast"
import { parseTypeOnlyToAst } from "../src/parse-typeonly"

describe("AST Specification for Named Import", () => {

  test("a classic import", () => {
    const input = `import IF, { A as B, C as D } from "./test-test.js"`
    const ast = parseTypeOnlyToAst(input)
    const classicImport = ast.declarations![0] as AstClassicImport
    expect(classicImport.whichDeclaration).toBe("import")
    expect(classicImport.whichImport).toBe("classic")
    expect(classicImport.from).toBe("\"./test-test.js\"")
    expect(classicImport.namedMembers).toEqual([
      {
        name: "A",
        as: "B"
      },
      {
        name: "C",
        as: "D"
      }
    ])
  })

  test("a namespaced import", () => {
    const input = `import * as DF from "./test-test.js"`
    const ast = parseTypeOnlyToAst(input)
    const namespacedImport = ast.declarations![0] as AstNamespacedImport
    expect(namespacedImport.whichDeclaration).toBe("import")
    expect(namespacedImport.whichImport).toBe("namespaced")
    expect(namespacedImport.from).toBe("\"./test-test.js\"")
    expect(namespacedImport.asNamespace).toBe("DF")
  })

})