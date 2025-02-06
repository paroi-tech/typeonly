import { describe, expect, test } from "vitest";
import { parseTypeOnly } from "../../src/api.js";
import type { AstNamedType } from "../../src/ast.d.ts";

describe("AST Specification for InlineImport", () => {
  test("a InlineImport", () => {
    const source = `
    type T1 = import("./abc").Test
`;
    const ast = parseTypeOnly({ source });
    const namedType = ast.declarations?.[0] as AstNamedType;
    expect(namedType.name).toBe("T1");
    expect(namedType.type).toEqual({
      whichType: "inlineImport",
      from: "./abc",
      exportedName: "Test",
    });
  });
});
