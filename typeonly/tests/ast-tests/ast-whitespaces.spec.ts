import { describe, expect, test } from "vitest";
import { parseTypeOnly } from "../../src/api.js";

describe("AST Specification about White Spaces", () => {
  test("weird spaces do not matter", () => {
    const source = `

   interface    I1

 {

  a : string

 b:string
 }

      `;
    const ast = parseTypeOnly({ source });
    expect(ast.declarations?.length).toBe(1);
  });


  test("new lines in a named type", () => {
    parseTypeOnly({
      source: `
type T1
=
number
[

]
`
    });
  });

  test("new lines in a named interface", () => {
    parseTypeOnly({
      source: `
export
  interface I1 {
  readonly
  a
  :
  string
}
`
    });
  });
});