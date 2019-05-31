import Checker from "../../dist/checker/Checker"
import { parseTypeOnlyToAst } from "../../dist/parser/parse-typeonly"

describe("Check nameType with string", () => {

  test("primitive types", () => {
    const input = `
    type A = B
    type B = number
`
    const ast = parseTypeOnlyToAst(input)
    const checker = new Checker(ast)
    const response = checker.check("A", "12")
    expect(response.valid).toBe(false)
    expect(response.error).not.toBeUndefined()

  })




  //   test("primitive types", () => {
  //     const input = `
  //     type A = {
  //       a: [string, number],
  //       b: string
  //     }
  // `
  //     const ast = parseTypeOnlyToAst(input)
  //     const checker = new Checker(ast)
  //     const response = checker.check("A", { a: ["sd", "23"], b: "ab" })
  //     expect(response.valid).toBe(false)
  //     expect(response.error).toBe("Expected type number, received: \'string\'.")

  //   })

})