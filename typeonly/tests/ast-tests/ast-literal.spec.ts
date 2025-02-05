import { describe, expect, test } from "vitest";
import { parseTypeOnly } from "../../src/api.js";
import type { AstLiteralType, AstNamedType } from "../../src/ast.js";

describe("AST Specification for Literal Types", () => {
  const validStringLiterals = [`"abc"`, `"a\\"b"`, `'a\\'b'`];
  validStringLiterals.forEach((literal) => {
    test(`valid string literal: ${literal}`, () => {
      const source = `type T1 = ${literal}`;
      const ast = parseTypeOnly({ source });
      const namedType = ast.declarations?.[0] as AstNamedType;
      expect(namedType.type).toEqual({
        whichType: "literal",
        // biome-ignore lint/security/noGlobalEval: allow eval here
        literal: eval(literal),
        stringDelim: literal[0],
      } as AstLiteralType);
    });
  });

  const validLiterals = ["23n", "12", "2.3", "false", "true"];
  validLiterals.forEach((literal) => {
    test(`valid literal: ${literal}`, () => {
      const source = `type T1 = ${literal}`;
      const ast = parseTypeOnly({ source });
      const namedType = ast.declarations?.[0] as AstNamedType;
      expect(namedType.type).toEqual({
        whichType: "literal",
        // biome-ignore lint/security/noGlobalEval: allow eval here
        literal: eval(literal),
      } as AstLiteralType);
    });
  });
});
