import { describe, expect, test } from "vitest";
import { parseTypeOnly } from "../../src/api.js";
import type { AstInterface, AstNamedType } from "../../src/ast.d.ts";

describe("AST Specification for Named Types", () => {
  test("type as alias", () => {
    const source = `
type T1 = string
`;
    const ast = parseTypeOnly({ source });
    const namedType = ast.declarations?.[0] as AstNamedType;
    expect(namedType.name).toBe("T1");
    expect(namedType.type).toBe("string");
  });

  test("type assign with interface", () => {
    const source = `
type T1 = { a: number }
`;
    const ast = parseTypeOnly({ source });
    const namedType = ast.declarations?.[0] as AstNamedType;
    const type = namedType.type as AstInterface;
    expect(type.whichType).toBe("interface");
  });
});
