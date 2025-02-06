import { describe, expect, test } from "vitest";
import { parseTypeOnly } from "../../src/api.js";
import type { AstNamedType } from "../../src/ast.d.ts";

describe("AST Specification for KeyOf", () => {
  test("a keyOf with interface", () => {
    const source = `
    type T1 = keyof {a:number}
`;
    const ast = parseTypeOnly({ source });
    const namedType = ast.declarations?.[0] as AstNamedType;
    expect(namedType.name).toBe("T1");
    expect(namedType.type).toEqual({
      whichType: "keyof",
      type: {
        whichType: "interface",
        entries: [
          {
            whichEntry: "property",
            name: "a",
            optional: false,
            readonly: false,
            type: "number",
          },
        ],
      },
    });
  });
});
