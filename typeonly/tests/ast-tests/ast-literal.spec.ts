import { describe, expect, test } from "vitest";
import { parseTypeOnly } from "../../src/api.js";
import type { AstLiteralType, AstNamedType } from "../../src/ast.js";

describe("AST Specification for Literal Types", () => {
  const validStringLiterals = [
    { literal: `"abc"`, result: "abc" },
    { literal: `"a\\"b"`, result: 'a"b' },
    { literal: `'a\\'b'`, result: "a'b" },
  ];

  validStringLiterals.forEach(({ literal, result }) => {
    test(`valid string literal: ${literal}`, () => {
      const source = `type T1 = ${literal}`;
      const ast = parseTypeOnly({ source });
      const namedType = ast.declarations?.[0] as AstNamedType;
      expect(namedType.type).toEqual({
        whichType: "literal",
        literal: result,
        stringDelim: literal[0],
      } as AstLiteralType);
    });
  });

  const validLiterals = [
    { literal: "23n", result: 23n },
    { literal: "12", result: 12 },
    { literal: "2.3", result: 2.3 },
    { literal: "false", result: false },
    { literal: "true", result: true },
  ];
  validLiterals.forEach(({ literal, result }) => {
    test(`valid literal: ${literal}`, () => {
      const source = `type T1 = ${literal}`;
      const ast = parseTypeOnly({ source });
      const namedType = ast.declarations?.[0] as AstNamedType;
      expect(namedType.type).toEqual({
        whichType: "literal",
        literal: result,
      } as AstLiteralType);
    });
  });
});
