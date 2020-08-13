import { createStandaloneRtoModule, parseTypeOnly } from "../../src/api"
import { RtoArrayType, RtoBaseNamedType, RtoCompositeType, RtoFunctionType, RtoGenericInstance, RtoInterface, RtoKeyofType, RtoLiteralType, RtoLocalTypeRef, RtoMemberType, RtoTupleType, RtoTypeName } from "../../src/rto"

describe("RTO Specification for RtoTypes", () => {

  test("RtoTypeName", () => {
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
      const rtoModule = createStandaloneRtoModule({
        ast: parseTypeOnly({ source: source["input"] })
      })

      expect(rtoModule.namedTypes!.length).toBe(1)
      const rtoNamedType = rtoModule.namedTypes![0] as RtoTypeName & RtoBaseNamedType
      expect(rtoNamedType).toEqual(source["output"])
    }
  })


  test("RtoLocalTypeRef", () => {
    const source = `
      export type T1 = B
      type B = number
    `
    const rtoModule = createStandaloneRtoModule({
      ast: parseTypeOnly({ source })
    })

    expect(rtoModule.namedTypes!.length).toBe(2)
    const rtoNamedType = rtoModule.namedTypes![0] as RtoLocalTypeRef & RtoBaseNamedType
    expect(rtoNamedType).toEqual({
      name: "T1",
      exported: true,
      kind: "localRef",
      refName: "B"
    })
  })


  test("RtoLiteralType", () => {
    const source = `
      export type T1 = "number[]"
    `
    const rtoModule = createStandaloneRtoModule({
      ast: parseTypeOnly({ source })
    })

    expect(rtoModule.namedTypes!.length).toBe(1)
    const rtoNamedType = rtoModule.namedTypes![0] as RtoLiteralType & RtoBaseNamedType
    expect(rtoNamedType).toEqual({
      name: "T1",
      exported: true,
      kind: "literal",
      literal: "number[]"
    })
  })


  test("RtoCompositeType", () => {
    const source = `
      export type T1 = "number[]" | 12
    `
    const rtoModule = createStandaloneRtoModule({
      ast: parseTypeOnly({ source })
    })

    expect(rtoModule.namedTypes!.length).toBe(1)
    const rtoNamedType = rtoModule.namedTypes![0] as RtoCompositeType & RtoBaseNamedType
    expect(rtoNamedType.docComment).toBeUndefined()
    expect(rtoNamedType.exported).toBe(true)
    expect(rtoNamedType.generic).toBeUndefined()
    expect(rtoNamedType.kind).toBe("composite")
    expect(rtoNamedType.name).toBe("T1")
    expect(rtoNamedType.types).toEqual([
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


  test("RtoTupleType", () => {
    const source = `
      export type T1 = [number, string]
    `
    const rtoModule = createStandaloneRtoModule({
      ast: parseTypeOnly({ source })
    })

    expect(rtoModule.namedTypes!.length).toBe(1)
    const rtoNamedType = rtoModule.namedTypes![0] as RtoTupleType & RtoBaseNamedType
    expect(rtoNamedType.docComment).toBeUndefined()
    expect(rtoNamedType.exported).toBe(true)
    expect(rtoNamedType.generic).toBeUndefined()
    expect(rtoNamedType.kind).toBe("tuple")
    expect(rtoNamedType.name).toBe("T1")
    expect(rtoNamedType.itemTypes).toEqual([
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


  test("RtoKeyofType", () => {
    const source = `
      export type T1 = keyof {a: number, b: string}
    `
    const rtoModule = createStandaloneRtoModule({
      ast: parseTypeOnly({ source })
    })

    expect(rtoModule.namedTypes!.length).toBe(1)
    const rtoNamedType = rtoModule.namedTypes![0] as RtoKeyofType & RtoBaseNamedType
    expect(rtoNamedType.docComment).toBeUndefined()
    expect(rtoNamedType.exported).toBe(true)
    expect(rtoNamedType.generic).toBeUndefined()
    expect(rtoNamedType.kind).toBe("keyof")
    expect(rtoNamedType.name).toBe("T1")
    const rtoInterface = rtoNamedType.type as RtoInterface
    expect(rtoInterface.kind).toBe("interface")
    expect(rtoInterface.properties).toEqual([
      {
        name: "a",
        type: {
          kind: "name",
          group: "primitive",
          refName: "number"
        }
      },
      {
        name: "b",
        type: {
          kind: "name",
          group: "primitive",
          refName: "string"
        }
      }
    ])
  })


  test("RtoMemberType", () => {
    const source = `
      export type T1 = B["b"]
      type B = { a: string, b: boolean }
    `
    const rtoModule = createStandaloneRtoModule({
      ast: parseTypeOnly({ source })
    })

    expect(rtoModule.namedTypes!.length).toBe(2)
    const rtoNamedType = rtoModule.namedTypes![0] as RtoMemberType & RtoBaseNamedType
    expect(rtoNamedType.docComment).toBeUndefined()
    expect(rtoNamedType.exported).toBe(true)
    expect(rtoNamedType.generic).toBeUndefined()
    expect(rtoNamedType.kind).toBe("member")
    expect(rtoNamedType.name).toBe("T1")
    expect(rtoNamedType.parentType).toEqual({
      kind: "localRef", refName: "B"
    })
    expect(rtoNamedType.memberName).toEqual({
      literal: "b"
    })
  })


  test("RtoMemberType and RtoMemberNameLiteral", () => {
    const source = `
      export type T1 = B["b"]
      type B = {
        a: string
        b: boolean
      }
    `
    const rtoModule = createStandaloneRtoModule({
      ast: parseTypeOnly({ source })
    })

    expect(rtoModule.namedTypes!.length).toBe(2)
    const rtoNamedType = rtoModule.namedTypes![0] as RtoMemberType & RtoBaseNamedType
    expect(rtoNamedType.docComment).toBeUndefined()
    expect(rtoNamedType.exported).toBe(true)
    expect(rtoNamedType.generic).toBeUndefined()
    expect(rtoNamedType.kind).toBe("member")
    expect(rtoNamedType.name).toBe("T1")
    expect(rtoNamedType.parentType).toEqual({
      kind: "localRef",
      refName: "B"
    })
    expect(rtoNamedType.memberName).toEqual({
      literal: "b"
    })
  })


  test("RtoInterface and RtoProperty", () => {
    const source = `
      export type T1 = {
        a: number,
        b: string
      }
    `
    const rtoModule = createStandaloneRtoModule({
      ast: parseTypeOnly({ source })
    })

    expect(rtoModule.namedTypes!.length).toBe(1)
    const rtoNamedType = rtoModule.namedTypes![0] as RtoInterface & RtoBaseNamedType
    expect(rtoNamedType.docComment).toBeUndefined()
    expect(rtoNamedType.exported).toBe(true)
    expect(rtoNamedType.generic).toBeUndefined()
    expect(rtoNamedType.kind).toBe("interface")
    expect(rtoNamedType.name).toBe("T1")
    expect(rtoNamedType.properties).toEqual([
      {
        name: "a",
        type: {
          kind: "name",
          group: "primitive",
          refName: "number"
        }
      },
      {
        name: "b",
        type: {
          kind: "name",
          group: "primitive",
          refName: "string"
        }
      }
    ])
  })


  test("RtoInterface with indexSignature", () => {
    const source = `
        export type T1 = {
          [A: number]: boolean
          b: string
        }
      `
    const rtoModule = createStandaloneRtoModule({
      ast: parseTypeOnly({ source })
    })

    expect(rtoModule.namedTypes!.length).toBe(1)
    const rtoNamedType = rtoModule.namedTypes![0] as RtoInterface & RtoBaseNamedType
    expect(rtoNamedType.docComment).toBeUndefined()
    expect(rtoNamedType.exported).toBe(true)
    expect(rtoNamedType.generic).toBeUndefined()
    expect(rtoNamedType.kind).toBe("interface")
    expect(rtoNamedType.name).toBe("T1")
    expect(rtoNamedType.indexSignature).toBeDefined()
    expect(rtoNamedType.indexSignature).toEqual({
      keyName: "A",
      keyType: "number",
      type: {
        kind: "name",
        group: "primitive",
        refName: "boolean"
      }
    })
    expect(rtoNamedType.properties).toEqual([
      {
        name: "b",
        type: {
          kind: "name",
          group: "primitive",
          refName: "string"
        }
      }
    ])
  })


  test("RtoInterface with mappedIndexSignature", () => {
    const source = `
        export type T1 = {
          [A in B]: boolean
        }
        type B = ["a", "b"]
      `
    const rtoModule = createStandaloneRtoModule({
      ast: parseTypeOnly({ source })
    })

    expect(rtoModule.namedTypes!.length).toBe(2)
    const rtoNamedType = rtoModule.namedTypes![0] as RtoInterface & RtoBaseNamedType
    expect(rtoNamedType.docComment).toBeUndefined()
    expect(rtoNamedType.exported).toBe(true)
    expect(rtoNamedType.generic).toBeUndefined()
    expect(rtoNamedType.kind).toBe("interface")
    expect(rtoNamedType.name).toBe("T1")
    expect(rtoNamedType.indexSignature).toBeUndefined()
    expect(rtoNamedType.properties).toBeUndefined()
    expect(rtoNamedType.mappedIndexSignature).toEqual({
      keyName: "A",
      keyInType: { kind: "localRef", refName: "B" },
      type: {
        kind: "name",
        group: "primitive",
        refName: "boolean"
      }
    })
  })


  test("RtoFunctionType, RtoGenericParameter and RtoFunctionParameter", () => {
    const source = `
       export type T1 = <A> (a?: string) => number
      `
    const rtoModule = createStandaloneRtoModule({
      ast: parseTypeOnly({ source })
    })

    expect(rtoModule.namedTypes!.length).toBe(1)
    const rtoNamedType = rtoModule.namedTypes![0] as RtoFunctionType & RtoBaseNamedType
    expect(rtoNamedType.docComment).toBeUndefined()
    expect(rtoNamedType.exported).toBe(true)
    expect(rtoNamedType.kind).toBe("function")
    expect(rtoNamedType.name).toBe("T1")
    expect(rtoNamedType.returnType).toEqual(
      {
        kind: "name",
        group: "primitive",
        refName: "number"
      }
    )
    expect(rtoNamedType.parameters).toEqual([
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
    expect(rtoNamedType.generic).toEqual([
      {
        name: "A"
      }
    ])
  })


  test("RtoGenericInstance", () => {
    const source = `
       export type T1 = A <number>
      `
    const rtoModule = createStandaloneRtoModule({
      ast: parseTypeOnly({ source })
    })

    expect(rtoModule.namedTypes!.length).toBe(1)
    const rtoNamedType = rtoModule.namedTypes![0] as RtoGenericInstance & RtoBaseNamedType
    expect(rtoNamedType.docComment).toBeUndefined()
    expect(rtoNamedType.exported).toBe(true)
    expect(rtoNamedType.generic).toBeUndefined()
    expect(rtoNamedType.kind).toBe("genericInstance")
    expect(rtoNamedType.name).toBe("T1")
    expect(rtoNamedType.genericName).toBe("A")
    expect(rtoNamedType.parameterTypes).toEqual([
      {
        kind: "name",
        group: "primitive",
        refName: "number"
      }
    ])
  })


  test("RtoArrayType", () => {
    const source = `
      export type T1 = number[]
    `
    const rtoModule = createStandaloneRtoModule({
      ast: parseTypeOnly({ source })
    })

    expect(rtoModule.namedTypes!.length).toBe(1)
    const rtoNamedType = rtoModule.namedTypes![0] as RtoArrayType & RtoBaseNamedType
    expect(rtoNamedType.docComment).toBeUndefined()
    expect(rtoNamedType.exported).toBe(true)
    expect(rtoNamedType.generic).toBeUndefined()
    expect(rtoNamedType.kind).toBe("array")
    expect(rtoNamedType.name).toBe("T1")
    expect(rtoNamedType.itemType).toEqual(
      {
        kind: "name",
        group: "primitive",
        refName: "number"
      }
    )
  })

  // TODO: Test RtoGenericParameterName

})