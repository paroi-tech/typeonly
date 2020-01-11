import { readModules } from "@typeonly/reader"
import { createStandaloneRtoModule, parseTypeOnly } from "typeonly"
import { createChecker, createCheckerFromModules } from "../src/api"

describe("Check Types", () => {

  test("TypeName", async () => {
    const source = `
    export type A = B
    type B = number
`
    const modules = await readModules({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })
    const checker = createCheckerFromModules(modules)

    const response = checker.check("./mod1", "A", "12")

    expect(response.valid).toBe(false)
    expect(response.error).not.toBeUndefined()
  })


  test("ArrayType", async () => {
    const source = `
      export type A = number[]
    `
    const checker = await createChecker({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    const result = checker.check("./mod1", "A", [12, "90"])

    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })


  test("TupleType", async () => {
    const source = `
      export type A = [number, string]
    `
    const checker = await createChecker({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    const result = checker.check("./mod1", "A", [12, "90", 23])

    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })

  test("KeyofType", async () => {
    const source = `
      export type A = keyof B
      interface B {
        [A: number]: boolean
        a: string
    }
    `

    const checker = await createChecker({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    const result = checker.check("./mod1", "A", 12)

    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  test("MemberType", async () => {
    const source = `
      export type A = B["a"]
      interface B {
        a: string
    }
    `

    const checker = await createChecker({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    const result = checker.check("./mod1", "A", "sdds")

    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })


  test("FunctionType", async () => {
    const source = `
      export type A = () => number
    `

    const checker = await createChecker({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    const result = checker.check("./mod1", "A", () => "12")

    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  test("CompositeType", async () => {
    const source = `
      export type A = "12" | 12
    `

    const checker = await createChecker({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    const result = checker.check("./mod1", "A", 12)

    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  test("CompositeType with null type", async () => {
    const source = `
      export type A = string | null
    `

    const checker = await createChecker({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    const result = checker.check("./mod1", "A", null)
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })


  test("LiteralType", async () => {
    const source = `
      export type A = "ff"
    `

    const checker = await createChecker({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    const result = checker.check("./mod1", "A", "ff")

    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })


  test("LocalTypeRef", async () => {
    const source = `
      export type A = B
      type B = number
    `

    const checker = await createChecker({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    const result = checker.check("./mod1", "A", 12)

    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })


  // test("GenericInstance", async () => {
  //   const source = `
  //     export type A = B<number>
  //     type B = {a: number}
  //   `

  //   // type A = B<number>
  //   // type B = G<number, string>
  //   // type G = Array<number>

  //   const checker = await createChecker({
  //     modulePaths: ["./mod1"],
  //     rtoModuleProvider: async () => createStandaloneRtoModule({
  //       ast: parseTypeOnly({ source })
  //     })
  //   })

  //   const result = checker.check("./mod1", "A", 12)

  //   expect(result.valid).toBe(true)
  //   expect(result.error).toBeUndefined()
  // })


})