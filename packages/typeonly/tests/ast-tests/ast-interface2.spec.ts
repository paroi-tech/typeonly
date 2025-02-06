import { describe, expect, test } from "vitest";
import { parseTypeOnly } from "../../src/api.js";
import type {
  AstFunctionProperty,
  AstFunctionType,
  AstNamedInterface,
  AstProperty,
} from "../../src/ast.d.ts";

describe("AST Specification for Interfaces (part 2)", () => {
  const testFunctionAsProperty = (source: string, parameters: any[], returnType: string) => {
    test(`a function as property, ${parameters.length === 0 ? "no parameter" : `with ${parameters.length} parameters`}`, () => {
      const ast = parseTypeOnly({ source });
      const namedInterface = ast.declarations?.[0] as AstNamedInterface;
      const prop = namedInterface.entries?.[0] as AstProperty;
      expect(prop.whichEntry).toBe("property");
      expect(prop.name).toBe("a");
      const propType = prop.type as AstFunctionType;
      expect(propType.whichType).toBe("function");
      expect(propType.parameters).toEqual(parameters.length === 0 ? undefined : parameters);
      expect(propType.returnType).toBe(returnType);
    });
  };

  const testFunctionProperty = (source: string, parameters: any[], returnType: string) => {
    test(`a function as functionProperty, ${parameters.length === 0 ? "no parameter" : `with ${parameters.length} parameters`}`, () => {
      const ast = parseTypeOnly({ source });
      const namedInterface = ast.declarations?.[0] as AstNamedInterface;
      const prop = namedInterface.entries?.[0] as AstFunctionProperty;
      expect(prop.whichEntry).toBe("functionProperty");
      expect(prop.name).toBe("a");
      expect(prop.parameters).toEqual(parameters.length === 0 ? undefined : parameters);
      expect(prop.returnType).toBe(returnType);
    });
  };

  testFunctionProperty(
    `
interface I1 {
  a(): number
}`,
    [],
    "number",
  );

  testFunctionAsProperty(
    `
interface I1 {
  a: () => number
}`,
    [],
    "number",
  );

  const parameters = [
    {
      name: "p1",
      type: "T1",
      optional: false,
    },
    {
      name: "p2",
      type: "T2",
      optional: false,
    },
  ];

  testFunctionProperty(
    `
interface I1 {
  a(p1: T1, p2: T2): void
}`,
    parameters,
    "void",
  );

  testFunctionAsProperty(
    `
interface I1 {
  a: (p1: T1, p2: T2) => void
}`,
    parameters,
    "void",
  );
});
