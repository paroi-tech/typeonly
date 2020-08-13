import { createStandaloneRtoModule, parseTypeOnly } from "typeonly"
import { loadModules } from "../src/api"
import { ArrayType, BaseNamedType, CompositeType, FunctionType, GenericInstance, Interface, KeyofType, LiteralType, LocalTypeRef, MemberType, TupleType, TypeName } from "../src/typeonly-loader"

describe("Loader Specification for Types", () => {

  test("TypeName", async () => {
    const rtoSpecialTypeName = ["any", "unknown", "object", "void", "never"]
    const rtoPrimitiveTypeName = ["string", "number", "bigint", "boolean", "undefined", "null", "symbol"]
    const sources: any[] = []
    for (const ts of rtoSpecialTypeName) {
      sources.push(
        {
          input: "export type T1 = " + ts,
          output: {
            name: "T1",
            exported: true,
            kind: "name",
            group: "ts",
            refName: ts
          }
        }
      )
    }
    for (const primitive of rtoPrimitiveTypeName) {
      sources.push(
        {
          input: "export type T1 = " + primitive,
          output: {
            name: "T1",
            exported: true,
            kind: "name",
            group: "primitive",
            refName: primitive
          }
        }
      )
    }
    for (const source of sources) {
      const modules = await loadModules({
        modulePaths: ["./mod1"],
        rtoModuleProvider: async () => createStandaloneRtoModule({
          ast: parseTypeOnly({ source: source["input"] })
        })
      })

      expect(modules["./mod1"]).toBeDefined()
      expect(modules["./mod1"]["namedTypes"]).toBeDefined()
      expect(modules["./mod1"]["namedTypes"]["T1"]).toBeDefined()
      const namedType = modules["./mod1"]["namedTypes"]["T1"] as TypeName & BaseNamedType
      delete namedType["module"]
      expect(namedType).toEqual(source["output"])
    }
  })


  test("ArrayType", async () => {
    const source = `
      export type T1 = number[]
    `

    const modules = await loadModules({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    expect(modules["./mod1"]).toBeDefined()
    expect(modules["./mod1"]["namedTypes"]).toBeDefined()
    expect(modules["./mod1"]["namedTypes"]["T1"]).toBeDefined()
    const namedType = modules["./mod1"]["namedTypes"]["T1"] as ArrayType & BaseNamedType
    expect(namedType.name).toBe("T1")
    expect(namedType.exported).toBe(true)
    expect(namedType.kind).toBe("array")
    expect(namedType.itemType).toEqual(
      {
        kind: "name",
        group: "primitive",
        refName: "number"
      })
  })

  test("LocalTypeRef", async () => {
    const source = `
        export type T1 = B
        type B = number
      `

    const modules = await loadModules({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    expect(modules["./mod1"]).toBeDefined()
    expect(modules["./mod1"]["namedTypes"]).toBeDefined()
    expect(modules["./mod1"]["namedTypes"]["T1"]).toBeDefined()
    const namedType = modules["./mod1"]["namedTypes"]["T1"] as LocalTypeRef & BaseNamedType
    expect(namedType.name).toBe("T1")
    expect(namedType.exported).toBe(true)
    expect(namedType.module).toBeDefined()
    expect(namedType.generic).toBeUndefined()
    expect(namedType.kind).toBe("localRef")
    expect(namedType.refName).toBe("B")
    expect(namedType.ref.module).toBeDefined()
    delete namedType.ref.module
    expect(namedType.ref).toEqual({
      name: "B",
      exported: false,
      kind: "name",
      group: "primitive",
      refName: "number"
    })
  })


  test("LiteralType", async () => {
    const source = `
        export type T1 = "number[]"
      `

    const modules = await loadModules({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    expect(modules["./mod1"]).toBeDefined()
    expect(modules["./mod1"]["namedTypes"]).toBeDefined()
    expect(modules["./mod1"]["namedTypes"]["T1"]).toBeDefined()
    const namedType = modules["./mod1"]["namedTypes"]["T1"] as LiteralType & BaseNamedType

    delete namedType.module
    expect(namedType).toEqual({
      name: "T1",
      exported: true,
      kind: "literal",
      literal: "number[]"
    })
  })


  test("CompositeType", async () => {
    const source = `
        export type T1 = "number[]" | 12
      `
    const modules = await loadModules({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    expect(modules["./mod1"]).toBeDefined()
    expect(modules["./mod1"]["namedTypes"]).toBeDefined()
    expect(modules["./mod1"]["namedTypes"]["T1"]).toBeDefined()
    const namedType = modules["./mod1"]["namedTypes"]["T1"] as CompositeType & BaseNamedType


    expect(namedType.docComment).toBeUndefined()
    expect(namedType.exported).toBe(true)
    expect(namedType.generic).toBeUndefined()
    expect(namedType.kind).toBe("composite")
    expect(namedType.name).toBe("T1")
    expect(namedType.types).toEqual([
      {
        kind: "literal",
        literal: "number[]"
      },
      {
        kind: "literal",
        literal: 12
      }
    ])
  })


  test("TupleType", async () => {
    const source = `
        export type T1 = [number, string]
      `
    const modules = await loadModules({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    expect(modules["./mod1"]).toBeDefined()
    expect(modules["./mod1"]["namedTypes"]).toBeDefined()
    expect(modules["./mod1"]["namedTypes"]["T1"]).toBeDefined()
    const namedType = modules["./mod1"]["namedTypes"]["T1"] as TupleType & BaseNamedType

    expect(namedType.docComment).toBeUndefined()
    expect(namedType.exported).toBe(true)
    expect(namedType.generic).toBeUndefined()
    expect(namedType.kind).toBe("tuple")
    expect(namedType.name).toBe("T1")
    expect(namedType.itemTypes).toEqual([
      {
        kind: "name",
        group: "primitive",
        refName: "number"
      },
      {
        kind: "name",
        group: "primitive",
        refName: "string"
      }
    ])
  })


  test("KeyofType", async () => {
    const source = `
        export type T1 = keyof {a: number, b: string}
      `
    const modules = await loadModules({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    expect(modules["./mod1"]).toBeDefined()
    expect(modules["./mod1"]["namedTypes"]).toBeDefined()
    expect(modules["./mod1"]["namedTypes"]["T1"]).toBeDefined()
    const namedType = modules["./mod1"]["namedTypes"]["T1"] as KeyofType & BaseNamedType

    expect(namedType.docComment).toBeUndefined()
    expect(namedType.exported).toBe(true)
    expect(namedType.generic).toBeUndefined()
    expect(namedType.kind).toBe("keyof")
    expect(namedType.name).toBe("T1")
    const loaderInterface = namedType.type as Interface
    expect(loaderInterface.kind).toBe("interface")
    // expect(loaderInterface.properties).toEqual({
    //   a: {
    //     of: loaderInterface,
    //     name: "a",
    //     type: { kind: "name", group: "primitive", refName: "number" },
    //     optional: false,
    //     readonly: false
    //   },
    //   b: {
    //     of: loaderInterface,
    //     name: "b",
    //     type: { kind: "name", group: "primitive", refName: "string" },
    //     optional: false,
    //     readonly: false
    //   }
    // } as Properties)
  })


  test("MemberType", async () => {
    const source = `
        export type T1 = B["b"]
        type B = { a: string, b: boolean }
      `
    const modules = await loadModules({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    expect(modules["./mod1"]).toBeDefined()
    expect(modules["./mod1"]["namedTypes"]).toBeDefined()
    expect(modules["./mod1"]["namedTypes"]["T1"]).toBeDefined()
    const namedType = modules["./mod1"]["namedTypes"]["T1"] as MemberType & BaseNamedType

    expect(namedType.docComment).toBeUndefined()
    expect(namedType.exported).toBe(true)
    expect(namedType.generic).toBeUndefined()
    expect(namedType.kind).toBe("member")
    expect(namedType.name).toBe("T1")
    const localTypeRef = namedType.parentType as LocalTypeRef
    expect(localTypeRef.kind).toBe("localRef")
    expect(localTypeRef.refName).toBe("B")
    const loaderInterface = localTypeRef.ref as Interface & BaseNamedType
    expect(loaderInterface.docComment).toBeUndefined()
    expect(loaderInterface.exported).toBe(false)
    expect(loaderInterface.generic).toBeUndefined()
    expect(loaderInterface.kind).toBe("interface")
    expect(loaderInterface.name).toBe("B")
    // expect(loaderInterface.properties).toEqual({
    //   a: {
    //     of: loaderInterface,
    //     name: "a",
    //     type: { kind: "name", group: "primitive", refName: "string" },
    //     optional: false,
    //     readonly: false
    //   },
    //   b: {
    //     of: loaderInterface,
    //     name: "b",
    //     type: { kind: "name", group: "primitive", refName: "boolean" },
    //     optional: false,
    //     readonly: false
    //   }
    // } as Properties)
  })


  test("MemberType and MemberNameLiteral", async () => {
    const source = `
        export type T1 = B["b"]
        type B = {
          a: string
          b: boolean
        }
      `
    const modules = await loadModules({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    expect(modules["./mod1"]).toBeDefined()
    expect(modules["./mod1"]["namedTypes"]).toBeDefined()
    expect(modules["./mod1"]["namedTypes"]["T1"]).toBeDefined()
    const namedType = modules["./mod1"]["namedTypes"]["T1"] as MemberType & BaseNamedType

    expect(namedType.docComment).toBeUndefined()
    expect(namedType.exported).toBe(true)
    expect(namedType.generic).toBeUndefined()
    expect(namedType.kind).toBe("member")
    expect(namedType.name).toBe("T1")

    const localTypeRef = namedType.parentType as LocalTypeRef
    expect(localTypeRef.kind).toBe("localRef")
    expect(localTypeRef.refName).toBe("B")
    const loaderInterface = localTypeRef.ref as Interface & BaseNamedType
    expect(loaderInterface.docComment).toBeUndefined()
    expect(loaderInterface.exported).toBe(false)
    expect(loaderInterface.generic).toBeUndefined()
    expect(loaderInterface.kind).toBe("interface")
    expect(loaderInterface.name).toBe("B")
    // expect(loaderInterface.properties).toEqual({
    //   a: {
    //     of: loaderInterface,
    //     name: "a",
    //     type: { kind: "name", group: "primitive", refName: "string" },
    //     optional: false,
    //     readonly: false
    //   },
    //   b: {
    //     of: loaderInterface,
    //     name: "b",
    //     type: { kind: "name", group: "primitive", refName: "boolean" },
    //     optional: false,
    //     readonly: false
    //   }
    // } as Properties)
  })


  test("Interface and Property", async () => {
    const source = `
        export type T1 = {
          a: number,
          b: string
        }
      `
    const modules = await loadModules({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    expect(modules["./mod1"]).toBeDefined()
    expect(modules["./mod1"]["namedTypes"]).toBeDefined()
    expect(modules["./mod1"]["namedTypes"]["T1"]).toBeDefined()
    const namedType = modules["./mod1"]["namedTypes"]["T1"] as Interface & BaseNamedType

    expect(namedType.docComment).toBeUndefined()
    expect(namedType.exported).toBe(true)
    expect(namedType.generic).toBeUndefined()
    expect(namedType.kind).toBe("interface")
    expect(namedType.name).toBe("T1")
    // expect(namedType.properties).toEqual({
    //   a: {
    //     of: namedType,
    //     name: "a",
    //     type: { kind: "name", group: "primitive", refName: "number" },
    //     optional: false,
    //     readonly: false
    //   },
    //   b: {
    //     of: namedType,
    //     name: "b",
    //     type: { kind: "name", group: "primitive", refName: "string" },
    //     optional: false,
    //     readonly: false
    //   }
    // } as Properties)
  })


  test("Interface with indexSignature", async () => {
    const source = `
          export type T1 = {
            [A: number]: boolean
            b: string
          }
        `
    const modules = await loadModules({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    expect(modules["./mod1"]).toBeDefined()
    expect(modules["./mod1"]["namedTypes"]).toBeDefined()
    expect(modules["./mod1"]["namedTypes"]["T1"]).toBeDefined()
    const namedType = modules["./mod1"]["namedTypes"]["T1"] as Interface & BaseNamedType

    expect(namedType.docComment).toBeUndefined()
    expect(namedType.exported).toBe(true)
    expect(namedType.generic).toBeUndefined()
    expect(namedType.kind).toBe("interface")
    expect(namedType.name).toBe("T1")
    expect(namedType.indexSignature).toBeDefined()
    // expect(namedType.indexSignature).toEqual({
    //   of: namedType,
    //   keyName: "A",
    //   keyType: "number",
    //   type: { kind: "name", group: "primitive", refName: "boolean" },
    //   optional: false,
    //   readonly: false
    // } as IndexSignature)
    // expect(namedType.properties).toEqual({
    //   b: {
    //     of: namedType,
    //     name: "b",
    //     type: { kind: "name", group: "primitive", refName: "string" },
    //     optional: false,
    //     readonly: false
    //   }
    // } as Properties)
  })


  test("Interface with mappedIndexSignature", async () => {
    const source = `
          export type T1 = {
            [A in B]: boolean
          }
          type B = ["a", "b"]
        `
    const modules = await loadModules({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    expect(modules["./mod1"]).toBeDefined()
    expect(modules["./mod1"]["namedTypes"]).toBeDefined()
    expect(modules["./mod1"]["namedTypes"]["T1"]).toBeDefined()
    const namedType = modules["./mod1"]["namedTypes"]["T1"] as Interface & BaseNamedType

    expect(namedType.docComment).toBeUndefined()
    expect(namedType.exported).toBe(true)
    expect(namedType.generic).toBeUndefined()
    expect(namedType.kind).toBe("interface")
    expect(namedType.name).toBe("T1")
    expect(namedType.indexSignature).toBeUndefined()
    expect(namedType.properties).toBeUndefined()
    expect(namedType.mappedIndexSignature).toBeDefined()
    expect(namedType.mappedIndexSignature!.keyName).toBe("A")
    expect(namedType.mappedIndexSignature!.type).toEqual(
      {
        kind: "name",
        group: "primitive",
        refName: "boolean"
      }
    )
    expect(namedType.mappedIndexSignature!.optional).toBe(false)
    expect(namedType.mappedIndexSignature!.readonly).toBe(false)
    const localRef = namedType.mappedIndexSignature!.keyInType! as LocalTypeRef
    expect(localRef.kind).toBe("localRef")
    expect(localRef.refName).toBe("B")
    const tuple = localRef.ref as TupleType & BaseNamedType
    expect(tuple.name).toBe("B")
    expect(tuple.kind).toBe("tuple")
    expect(tuple.exported).toBe(false)
    expect(tuple.itemTypes).toEqual([
      {
        kind: "literal",
        literal: "a"
      },
      {
        kind: "literal",
        literal: "b"
      }
    ])
  })


  test("FunctionType, GenericParameter and FunctionParameter", async () => {
    const source = `
         export type T1 = <A> (a?: string) => number
        `
    const modules = await loadModules({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    expect(modules["./mod1"]).toBeDefined()
    expect(modules["./mod1"]["namedTypes"]).toBeDefined()
    expect(modules["./mod1"]["namedTypes"]["T1"]).toBeDefined()
    const namedType = modules["./mod1"]["namedTypes"]["T1"] as FunctionType & BaseNamedType

    expect(namedType.docComment).toBeUndefined()
    expect(namedType.exported).toBe(true)
    expect(namedType.kind).toBe("function")
    expect(namedType.name).toBe("T1")
    expect(namedType.returnType).toEqual(
      {
        kind: "name",
        group: "primitive",
        refName: "number"
      }
    )
    expect(namedType.parameters).toEqual([
      {
        name: "a",
        optional: true,
        type: {
          kind: "name",
          group: "primitive",
          refName: "string"
        }
      }
    ])
    expect(namedType.generic).toEqual([
      {
        name: "A"
      }
    ])
  })


  test("GenericInstance", async () => {
    const source = `
         export type T1 = A <number>
        `
    const modules = await loadModules({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    expect(modules["./mod1"]).toBeDefined()
    expect(modules["./mod1"]["namedTypes"]).toBeDefined()
    expect(modules["./mod1"]["namedTypes"]["T1"]).toBeDefined()
    const namedType = modules["./mod1"]["namedTypes"]["T1"] as GenericInstance & BaseNamedType

    expect(namedType.docComment).toBeUndefined()
    expect(namedType.exported).toBe(true)
    expect(namedType.generic).toBeUndefined()
    expect(namedType.kind).toBe("genericInstance")
    expect(namedType.name).toBe("T1")
    expect(namedType.genericName).toBe("A")
    expect(namedType.parameterTypes).toEqual([
      {
        kind: "name",
        group: "primitive",
        refName: "number"
      }
    ])
  })


  test("ArrayType", async () => {
    const source = `
        export type T1 = number[]
      `
    const modules = await loadModules({
      modulePaths: ["./mod1"],
      rtoModuleProvider: async () => createStandaloneRtoModule({
        ast: parseTypeOnly({ source })
      })
    })

    expect(modules["./mod1"]).toBeDefined()
    expect(modules["./mod1"]["namedTypes"]).toBeDefined()
    expect(modules["./mod1"]["namedTypes"]["T1"]).toBeDefined()
    const namedType = modules["./mod1"]["namedTypes"]["T1"] as ArrayType & BaseNamedType

    expect(namedType.docComment).toBeUndefined()
    expect(namedType.exported).toBe(true)
    expect(namedType.generic).toBeUndefined()
    expect(namedType.kind).toBe("array")
    expect(namedType.name).toBe("T1")
    expect(namedType.itemType).toEqual(
      {
        kind: "name",
        group: "primitive",
        refName: "number"
      }
    )
  })





})