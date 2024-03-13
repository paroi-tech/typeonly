import { loadModules } from "@typeonly/loader"
import { createStandaloneRtoModule, parseTypeOnly } from "typeonly"
import { createValidator, createValidatorFromModules } from "../src/api"

describe("Validate Types", () => {

  test("TypeName", async () => {
    const source = `
    export type A = B
    type B = number
`
    const modules = await loadModules({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })
    const validator = createValidatorFromModules(modules)

    const response = validator.validate("A", "12", "./mod1")

    expect(response.valid).toBe(false)
    expect(response.error).not.toBeUndefined()
  })


  test("ArrayType", async () => {
    const source = `
      export type A = number[]
    `
    const validator = await createValidator({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    const result = validator.validate("A", [12, "90"], "./mod1")

    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })


  test("TupleType", async () => {
    const source = `
      export type A = [number, string]
    `
    const validator = await createValidator({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    const result = validator.validate("A", [12, "90", 23], "./mod1")

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

    const validator = await createValidator({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    const result = validator.validate("A", 12, "./mod1")

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

    const validator = await createValidator({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    const result = validator.validate("A", "sdds", "./mod1")

    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })


  test("FunctionType", async () => {
    const source = `
      export type A = () => number
    `

    const validator = await createValidator({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    const result = validator.validate("A", () => "12", "./mod1")

    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  test("CompositeType", async () => {
    const source = `
      export type A = "12" | 12
    `

    const validator = await createValidator({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    const result = validator.validate("A", 12, "./mod1")

    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  test("CompositeType with null type", async () => {
    const source = `
      export type A = string | null
    `

    const validator = await createValidator({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    const result = validator.validate("A", null, "./mod1")
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })


  test("LiteralType", async () => {
    const source = `
      export type A = "ff"
    `

    const validator = await createValidator({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    const result = validator.validate("A", "ff", "./mod1")

    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })


  test("LocalTypeRef", async () => {
    const source = `
      export type A = B
      type B = number
    `

    const validator = await createValidator({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    const result = validator.validate("A", 12, "./mod1")

    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })


  test("Use default module name", async () => {
    const source = `
    export type A = B
    type B = number
`
    const modules = await loadModules({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })
    const validator = createValidatorFromModules(modules)

    const response = validator.validate("A", "12")

    expect(response.valid).toBe(false)
    expect(response.error).not.toBeUndefined()
  })


  // test("GenericInstance", async () => {
  //   const source = `
  //     export type A = B<number>
  //     type B = {a: number}
  //   `

  //   // type A = B<number>
  //   // type B = G<number, string>
  //   // type G = Array<number>

  //   const validator = await createValidator({
  //     modulePaths: ["./mod1"],
  //     rtoModuleProvider: async () => createStandaloneRtoModule({
  //       ast: parseTypeOnly({ source })
  //     })
  //   })

  //   const result = validator.validate("A", 12, "./mod1")

  //   expect(result.valid).toBe(true)
  //   expect(result.error).toBeUndefined()
  // })


})