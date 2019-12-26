import { createStandaloneRtoModule, parseTypeOnly } from "typeonly"
import { createChecker } from "../src/api"

describe("Check Interface", () => {

  test("interface with primitive types", async () => {
    const source = `
      export interface A {
        a: number,
        b: string
      }
    `

    const checker = await createChecker({
      modulePaths: ["./mod1"],
      moduleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    const result = checker.check("./mod1", "A",
      {
        a: 12,
        b: 22
      }
    )

    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })



  test("interface with array type", async () => {
    const source = `
      export type A = {
        a: number[],
        b: string
      }
  `
    const checker = await createChecker({
      modulePaths: ["./mod1"],
      moduleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    const result = checker.check("./mod1", "A",
      {
        a: [12, "23"],
        b: "ab"
      }
    )

    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })

  test("interface with literal type", async () => {
    const source = `
      export type A = {
        a: "test",
        b: string
      }
  `

    const checker = await createChecker({
      modulePaths: ["./mod1"],
      moduleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    const result = checker.check("./mod1", "A",
      {
        a: "test1",
        b: "ab"
      }
    )

    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })

  test("interface with tuple", async () => {
    const source = `
      export interface A {
        a: [string, number],
        b: string
      }
  `
    const checker = await createChecker({
      modulePaths: ["./mod1"],
      moduleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    const result = checker.check("./mod1", "A",
      {
        a: ["sd", "23"],
        b: "ab"
      }
    )

    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })

  test("check interface with depth", async () => {
    const source = `
      export type A = {
        a: {
          c: { d: boolean }[]
        },
        b: string
      }
  `
    const checker = await createChecker({
      modulePaths: ["./mod1"],
      moduleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    const result = checker.check("./mod1", "A",
      {
        a: {
          c: [
            {
              d: false
            }
          ]
        },
        b: "ab"
      }
    )

    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

})