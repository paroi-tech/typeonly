import { parseTypeOnlyToAst } from "../src/parser/parse-typeonly"

describe("AST Specification about White Spaces", () => {
  test("weird spaces do not matter", () => {
    const input = `

   interface    I1

 {

  a : string

 b:string
 }

      `
    const ast = parseTypeOnlyToAst(input)
    expect(ast.declarations!.length).toBe(1)
  })


  test("new lines in a named type", () => {
    parseTypeOnlyToAst(`
type T1
=
number
[

]
`)
  })

  test("new lines in a named interface", () => {
    parseTypeOnlyToAst(`
export
  interface I1 {
  readonly
  a
  :
  string
}
`)
  })
})