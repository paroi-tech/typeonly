import { describe, expect, test } from "vitest";
import { parseTypeOnly } from "../../src/api.js";
import type { AstClassicImport, AstNamespacedImport } from "../../src/ast.d.ts";

describe("AST Specification for Named Import", () => {
  test("a classic import", () => {
    const source = `import { A as B, C as D } from "./abc.js"`;
    const ast = parseTypeOnly({ source });
    const classicImport = ast.declarations?.[0] as AstClassicImport;
    expect(classicImport.whichDeclaration).toBe("import");
    expect(classicImport.whichImport).toBe("classic");
    expect(classicImport.from).toBe("./abc.js");
    expect(classicImport.namedMembers).toEqual([
      {
        name: "A",
        as: "B",
      },
      {
        name: "C",
        as: "D",
      },
    ]);
  });

  test("a namespaced import", () => {
    const source = `import * as ns from "./abc.js"`;
    const ast = parseTypeOnly({ source });
    const namespacedImport = ast.declarations?.[0] as AstNamespacedImport;
    expect(namespacedImport.whichDeclaration).toBe("import");
    expect(namespacedImport.whichImport).toBe("namespaced");
    expect(namespacedImport.from).toBe("./abc.js");
    expect(namespacedImport.asNamespace).toBe("ns");
  });
});
