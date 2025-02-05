import { createStandaloneRtoModule, parseTypeOnly } from "typeonly";
import { createValidator } from "../src/api.js";

describe("Validate Interface", () => {

  test("interface with primitive types", async () => {
    const source = `
      export interface A {
        a: number,
        b: string
      }
    `;

    const validator = await createValidator({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    });

    const result = validator.validate(
      "A",
      {
        a: 12,
        b: 22
      },
      "./mod1"
    );

    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });


  // test("interface with array type", async () => {
  //   const source = `
  //     export type A = {
  //       a: number[],
  //       b: string
  //     }
  // `
  //   const validator = await createValidator({
  //     modulePaths: ["./mod1"],
  //     rtoModuleProvider: async () => createStandaloneRtoModule({
  //       ast: parseTypeOnly({ source })
  //     })
  //   })

  //   const result = validator.validate(
  //     "A",
  //     {
  //       a: [12, "23"],
  //       b: "ab"
  //     },
  //     "./mod1"
  //   )

  //   expect(result.valid).toBe(false)
  //   expect(result.error).toBeDefined()
  // })

  // test("interface with literal type", async () => {
  //   const source = `
  //     export type A = {
  //       a: "test",
  //       b: string
  //     }
  // `

  //   const validator = await createValidator({
  //     modulePaths: ["./mod1"],
  //     rtoModuleProvider: async () => createStandaloneRtoModule({
  //       ast: parseTypeOnly({ source })
  //     })
  //   })

  //   const result = validator.validate(
  //     "A",
  //     {
  //       a: "test1",
  //       b: "ab"
  //     },
  //     "./mod1"
  //   )

  //   expect(result.valid).toBe(false)
  //   expect(result.error).toBeDefined()
  // })

  // test("interface with tuple", async () => {
  //   const source = `
  //     export interface A {
  //       a: [string, number],
  //       b: string
  //     }
  // `
  //   const validator = await createValidator({
  //     modulePaths: ["./mod1"],
  //     rtoModuleProvider: async () => createStandaloneRtoModule({
  //       ast: parseTypeOnly({ source })
  //     })
  //   })

  //   const result = validator.validate(
  //     "A",
  //     {
  //       a: ["sd", "23"],
  //       b: "ab"
  //     },
  //     "./mod1"
  //   )

  //   expect(result.valid).toBe(false)
  //   expect(result.error).toBeDefined()
  // })

  // test("validate interface with depth", async () => {
  //   const source = `
  //     export type A = {
  //       a: {
  //         c: { d: boolean }[]
  //       },
  //       b: string
  //     }
  // `
  //   const validator = await createValidator({
  //     modulePaths: ["./mod1"],
  //     rtoModuleProvider: async () => createStandaloneRtoModule({
  //       ast: parseTypeOnly({ source })
  //     })
  //   })

  //   const result = validator.validate(
  //     "A",
  //     {
  //       a: {
  //         c: [
  //           {
  //             d: false
  //           }
  //         ]
  //       },
  //       b: "ab"
  //     },
  //     "./mod1"
  //   )

  //   expect(result.valid).toBe(true)
  //   expect(result.error).toBeUndefined()
  // })

});