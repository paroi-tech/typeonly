import { readModules } from "@typeonly/reader"
import { createStandaloneRtoModule, parseTypeOnly } from "typeonly"
import Checker from "../src/Checker"

describe("Check nameType with string", () => {

  test("primitive types", async () => {
    const source = `
    export type A = B
    type B = number
`
    const modules = await readModules({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })
    const checker = new Checker(modules)

    const response = checker.check("./mod1", "A", "12")
    expect(response.conform).toBe(false)
    expect(response.error).not.toBeUndefined()
  })




  //   test("primitive types", () => {
  //     const source = `
  //     type A = {
  //       a: [string, number],
  //       b: string
  //     }
  // `
  //     const ast = parseTypeOnly({ source })
  //     const checker = new Checker(ast)
  //     const response = checker.check("A", { a: ["sd", "23"], b: "ab" })
  //     expect(response.valid).toBe(false)
  //     expect(response.error).toBe("Expected type number, received: \'string\'.")

  //   })

})