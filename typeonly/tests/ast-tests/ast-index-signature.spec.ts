import { describe, expect, test } from "vitest";
import { parseTypeOnly } from "../../src/api.js";
import type { AstInterface, AstNamedInterface, AstNamedType } from "../../src/ast.d.ts";

describe("AST Specification for Index Signature", () => {
  test("a index signature", () => {
    const source = `interface I1 {
      [index1: string] : {a: number}
    }`;
    const ast = parseTypeOnly({ source });
    const namedInterface = ast.declarations?.[0] as AstNamedInterface;
    expect(namedInterface.whichDeclaration).toBe("interface");
    expect(namedInterface.whichType).toBe("interface");
    expect(namedInterface.name).toBe("I1");
    expect(namedInterface.entries).toEqual([
      {
        whichEntry: "indexSignature",
        keyName: "index1",
        keyType: "string",
        optional: false,
        readonly: false,
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
      },
    ]);
  });

  test("a mapped index signature", () => {
    const source = `type T1 = {
      [index1 in string] : {a: number}
    }`;
    const ast = parseTypeOnly({ source });
    const namedType = ast.declarations?.[0] as AstNamedType;
    expect(namedType.whichDeclaration).toBe("type");
    expect(namedType.name).toBe("T1");
    const type = namedType.type as AstInterface;
    expect(type.whichType).toBe("interface");
    expect(type.entries).toEqual([
      {
        whichEntry: "mappedIndexSignature",
        keyName: "index1",
        optional: false,
        readonly: false,
        keyInType: "string",
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
      },
    ]);
  });
});
