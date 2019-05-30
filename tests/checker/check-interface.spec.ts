import Checker from "../../dist/checker/Checker"
import { parseTypeOnlyToAst } from "../../dist/parser/parse-typeonly"

describe("Check type of interface", () => {

  test("interface with primitive types", () => {
    const input = `
    type A = {
      a: number,
      b: string
    }
`
    const ast = parseTypeOnlyToAst(input)
    const checker = new Checker(ast)
    const response = checker.check("A", { a: 12, b: 22 })
    expect(response.valid).toBe(false)
    expect(response.error).not.toBeUndefined()
  })

  test("interface with array type", () => {
    const input = `
    type A = {
      a: number[],
      b: string
    }
`
    const ast = parseTypeOnlyToAst(input)
    const checker = new Checker(ast)
    const response = checker.check("A", { a: [12, "23"], b: "ab" })
    expect(response.valid).toBe(false)
    expect(response.error).not.toBeUndefined()
  })

  test("interface with literal type", () => {
    const input = `
    type A = {
      a: "test",
      b: string
    }
`
    const ast = parseTypeOnlyToAst(input)
    const checker = new Checker(ast)
    const response = checker.check("A", { a: "test1", b: "ab" })
    expect(response.valid).toBe(false)
    expect(response.error).not.toBeUndefined()
  })

  test("interface with tuple", () => {
    const input = `
    type A = {
      a: [string, number],
      b: string
    }
`
    const ast = parseTypeOnlyToAst(input)
    const checker = new Checker(ast)
    const response = checker.check("A", { a: ["sd", "23"], b: "ab" })
    expect(response.valid).toBe(false)
    expect(response.error).not.toBeUndefined()

  })

  test("check interface with depth", () => {
    const input = `
    type A = {
      a: {
        c: { d: boolean }[]
      },
      b: string
    }
`
    const ast = parseTypeOnlyToAst(input)
    const checker = new Checker(ast)
    const response = checker.check("A", {
      a: {
        c: [{
          d: false
        }]
      },
      b: "ab"
    })
    expect(response.valid).toBe(true)
    expect(response.error).toBeUndefined()
  })

})