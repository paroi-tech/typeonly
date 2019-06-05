import { createStandaloneRtoModule, parseTypeOnly } from "../../src/api"
import { RtoBaseNamedType, RtoInterface, RtoTypeName } from "../../src/rto"


describe("RTO Specification for Comment", () => {
  test("Comment with type", async () => {
    const source =
      `
      /**
       * something
       */
      export type T1 = number
      `
    const rtoModule = createStandaloneRtoModule({
      ast: parseTypeOnly({ source })
    })

    expect(rtoModule.namedTypes!.length).toBe(1)
    const rtoNamedType = rtoModule.namedTypes![0] as RtoTypeName & RtoBaseNamedType
    expect(rtoNamedType).toEqual({
      name: "T1",
      exported: true,
      docComment: "something",
      kind: "name",
      group: "primitive",
      refName: "number"
    })
  })

  test("Comment with interface", async () => {
    const source =
      `
      /**
       * something
       */
      export interface T1 {
        a: number
        }
      `
    const rtoModule = createStandaloneRtoModule({
      ast: parseTypeOnly({ source })
    })

    expect(rtoModule.namedTypes!.length).toBe(1)
    const rtoNamedType = rtoModule.namedTypes![0] as RtoInterface & RtoBaseNamedType
    console.log(rtoNamedType)
    expect(rtoNamedType.docComment).toBe("something")
    expect(rtoNamedType.exported).toBe(true)
    expect(rtoNamedType.generic).toBeUndefined()
    expect(rtoNamedType.kind).toBe("interface")
    expect(rtoNamedType.name).toBe("T1")
    expect(rtoNamedType.properties).toEqual([
      {
        name: "a",
        type: { kind: "name", group: "primitive", refName: "number" }
      }
    ])
  })

  test("Comment with interface property", async () => {
    const source =
      `
      export interface T1 {
        a: number
        /**
       * something
       */
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
        type: { kind: "name", group: "primitive", refName: "number" }
      },
      {
        name: "b",
        type: { kind: "name", group: "primitive", refName: "string" },
        docComment: "something"
      }
    ])
  })

})