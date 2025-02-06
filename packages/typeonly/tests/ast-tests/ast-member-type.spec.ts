import { describe, expect, test } from "vitest";
import { parseTypeOnly } from "../../src/api.js";
import type { AstMemberType, AstNamedType } from "../../src/ast.d.ts";

describe("AST Specification for MemberType", () => {
  test("a member type with identifier", () => {
    const source = `
    type T1 = Add[cv]
`;
    const ast = parseTypeOnly({ source });
    const namedType = ast.declarations?.[0] as AstNamedType;
    expect(namedType.name).toBe("T1");
    expect(namedType.type).toEqual({
      whichType: "member",
      memberName: "cv",
      parentType: "Add",
    } as AstMemberType);
  });
});
