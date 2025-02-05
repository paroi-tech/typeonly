import { describe, expect, test } from "vitest";
import { generateRtoModules, parseTypeOnly } from "../../src/api.js";
import type { RtoBaseNamedType, RtoImportedTypeRef } from "../../src/rto.d.ts";

describe("RTO Specification for Import", () => {
  test("RtoImportedTypeRef", async () => {
    const source1 = `
      import { T2 } from "./source2"
      export type T1 = T2
      `;
    const source2 = `
      export type T2 = boolean
      `;
    const rtoModules = (await generateRtoModules({
      modulePaths: ["./source1"],
      astProvider: (modulePath) => {
        if (modulePath === "./source1") return parseTypeOnly({ source: source1 });
        if (modulePath === "./source2") return parseTypeOnly({ source: source2 });
        throw new Error(`Unknown module: ${modulePath}`);
      },
      returnRtoModules: true,
    }));
    const rtoModule = rtoModules?.["./source1"];

    expect(rtoModule?.namedTypes?.length).toBe(1);
    const rtoNamedType = rtoModule?.namedTypes?.[0] as RtoImportedTypeRef & RtoBaseNamedType;
    expect(rtoNamedType).toEqual({
      name: "T1",
      exported: true,
      kind: "importedRef",
      refName: "T2",
    });
  });
});
