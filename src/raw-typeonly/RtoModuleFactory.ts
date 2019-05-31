import { AstArrayType, AstCompositeType, AstDeclaration, AstFunctionParameter, AstFunctionProperty, AstFunctionType, AstGenericInstance, AstGenericParameter, AstImport, AstIndexSignature, AstInlineComment, AstInlineImportType, AstInterface, AstInterfaceEntry, AstKeyofType, AstLiteralType, AstMappedIndexSignature, AstMemberType, AstNamedInterface, AstNamedType, AstProperty, AstTupleType, AstType, TypeOnlyAst } from "../ast"
import { RtoArrayType, RtoBaseNamedType, RtoCompositeType, RtoFunctionParameter, RtoFunctionType, RtoGenericInstance, RtoGenericParameter, RtoImportedTypeRef, RtoIndexSignature, RtoInterface, RtoKeyofType, RtoLiteralType, RtoLocalTypeRef, RtoMappedIndexSignature, RtoMemberType, RtoModule, RtoNamedType, RtoProperty, RtoTupleType, RtoType, RtoTypeName } from "../rto"
import ImportTool, { ImportRef } from "./ImportTool"
import Project from "./Project"

export default class RtoModuleFactory {
  private namedTypeList: RtoBaseNamedType[] = []
  private namedTypes = new Map<string, RtoBaseNamedType>()
  private importTool: ImportTool
  private module?: RtoModule
  private rtoTypeCreators: {
    [K in Exclude<AstType, string>["whichType"]]: (astNode: any) => RtoType
  }

  constructor(project: Project, ast: TypeOnlyAst, private path?: string) {
    this.importTool = new ImportTool(project, path)
    this.rtoTypeCreators = {
      array: astNode => this.createRtoArrayType(astNode),
      literal: astNode => this.createRtoLiteralType(astNode),
      composite: astNode => this.createRtoCompositeType(astNode),
      genericInstance: astNode => this.createRtoGenericInstance(astNode),
      keyof: astNode => this.createRtoKeyofType(astNode),
      member: astNode => this.createRtoMemberType(astNode),
      tuple: astNode => this.createRtoTupleType(astNode),
      function: astNode => this.createRtoFunctionType(astNode),
      inlineImport: astNode => this.createRtoImportedRefFromInline(astNode),
      interface: astNode => this.createRtoInterface(astNode),
    }
    if (ast.declarations) {
      ast.declarations.forEach(astDecl => this.registerAstDeclaration(astDecl))
      ast.declarations.forEach(astDecl => {
        if (astDecl.whichDeclaration === "interface" || astDecl.whichDeclaration === "type")
          this.fillAstNamed(astDecl)
      })
    }
  }

  getRtoModule(): RtoModule {
    if (!this.module) {
      this.module = {
        path: this.path,
        namedTypes: this.namedTypeList as RtoNamedType[]
      }
    }
    return this.module
  }

  private registerAstDeclaration(astNode: AstDeclaration) {
    switch (astNode.whichDeclaration) {
      case "import":
        this.importTool.addImport(astNode)
        break
      case "interface":
      case "type":
        const namedType = this.createRtoBaseNamedType(astNode)
        this.namedTypes.set(namedType.name, namedType)
        this.namedTypeList.push(namedType)
        break
      case "comment":
        break
      default:
        throw new Error(`Invalid whichDeclaration: ${astNode!.whichDeclaration}`)
    }
  }

  private createRtoBaseNamedType(astNode: AstNamedInterface | AstNamedType) {
    const result: RtoBaseNamedType = {
      name: astNode.name
    }
    if (astNode.exported)
      result.exported = astNode.exported
    if (astNode.docComment)
      result.docComment = astNode.docComment
    return result
  }

  private fillAstNamed(astNode: AstNamedInterface | AstNamedType) {
    const base = this.getBaseNamedType(astNode.name)
    const type = astNode.whichDeclaration === "interface"
      ? this.createRtoInterface(astNode)
      : this.createRtoType(astNode.type)
    Object.assign(base, type)
  }

  private createRtoType(astNode: AstType): RtoType {
    if (typeof astNode === "string") {
      const whichName = findWhichTypeName(astNode)
      if (whichName)
        return createRtoTypeName(whichName, astNode)
      if (this.namedTypes.get(astNode))
        return createRtoLocalTypeRef(astNode)
      const importRef = this.importTool.findImport(astNode)
      if (importRef)
        return createRtoImportedTypeRef(importRef)
      throw new Error(`Unexpected type: ${astNode}`)
    } else {
      const creator = this.rtoTypeCreators[astNode.whichType]
      if (!creator)
        throw new Error(`Unexpected whichType: ${astNode.whichType}`)
      return creator(astNode)
    }
  }

  private createRtoArrayType(astNode: AstArrayType): RtoArrayType {
    return {
      whichType: "array",
      itemType: this.createRtoType(astNode.itemType)
    }
  }

  private createRtoLiteralType(astNode: AstLiteralType): RtoLiteralType {
    return {
      whichType: "literal",
      literal: astNode.literal
    }
  }

  private createRtoCompositeType(astNode: AstCompositeType): RtoCompositeType {
    return {
      whichType: "composite",
      op: astNode.op,
      types: astNode.types.map(child => this.createRtoType(child))
    }
  }

  private createRtoGenericInstance(astNode: AstGenericInstance): RtoGenericInstance {
    return {
      whichType: "genericInstance",
      genericName: astNode.name,
      parameterTypes: astNode.parameterTypes.map(child => this.createRtoType(child))
    }
  }

  private createRtoKeyofType(astNode: AstKeyofType): RtoKeyofType {
    return {
      whichType: "keyof",
      type: this.createRtoType(astNode.type)
    }
  }

  private createRtoMemberType(astNode: AstMemberType): RtoMemberType {
    return {
      whichType: "member",
      type: this.createRtoType(astNode.type),
      memberName: astNode.memberName
    }
  }

  private createRtoTupleType(astNode: AstTupleType): RtoTupleType {
    return {
      whichType: "tuple",
      itemTypes: astNode.itemTypes ? astNode.itemTypes.map(child => this.createRtoType(child)) : []
    }
  }

  private createRtoFunctionType(astNode: AstFunctionType): RtoFunctionType {
    return {
      whichType: "function",
      parameters: this.createRtoFunctionParameters(astNode.parameters),
      returnType: this.createRtoType(astNode.returnType),
      generic: this.createRtoGenericParameters(astNode.generic)
    }
  }

  private createRtoFunctionParameters(astNodes: AstFunctionParameter[] | undefined): RtoFunctionParameter[] {
    if (!astNodes)
      return []
    return astNodes.map(({ name, type }) => {
      const param: RtoFunctionParameter = { name }
      if (type)
        param.type = this.createRtoType(type)
      return param
    })
  }

  private createRtoGenericParameters(astNodes: AstGenericParameter[] | undefined): RtoGenericParameter[] {
    if (!astNodes)
      return []
    return astNodes.map(({ name, extendsType, defaultType }) => {
      const param: RtoGenericParameter = { name }
      if (extendsType)
        param.extendsType = this.createRtoType(extendsType)
      if (defaultType)
        param.defaultType = this.createRtoType(defaultType)
      return param
    })
  }

  private createRtoImportedRefFromInline(astNode: AstInlineImportType): RtoImportedTypeRef {
    return createRtoImportedTypeRef(this.importTool.inlineImport(astNode))
  }

  private createRtoInterface(astNode: AstInterface): RtoInterface {
    const result: RtoInterface = {
      whichType: "interface"
    }
    if (astNode.entries) {
      const properties: RtoProperty[] = []
      for (const entry of astNode.entries) {
        if (entry.whichEntry === "indexSignature") {
          const indexSignature: RtoIndexSignature = {
            keyName: entry.keyName,
            keyType: entry.keyType,
            type: this.createRtoType(entry.type)
          }
          if (entry.optional)
            indexSignature.readonly = entry.readonly
          if (entry.readonly)
            indexSignature.readonly = entry.readonly
          result.indexSignature = indexSignature

        } else if (entry.whichEntry === "mappedIndexSignature") {
          const mappedIndexSignature: RtoMappedIndexSignature = {
            keyName: entry.keyName,
            keyInType: this.createRtoType(entry.keyInType),
            type: this.createRtoType(entry.type)
          }
          if (entry.optional)
            mappedIndexSignature.readonly = entry.readonly
          if (entry.readonly)
            mappedIndexSignature.readonly = entry.readonly
          result.mappedIndexSignature = mappedIndexSignature

        } else if (entry.whichEntry === "property") {
          const property: RtoProperty = {
            name: entry.name,
            type: this.createRtoType(entry.type),
          }
          if (entry.optional)
            property.readonly = entry.readonly
          if (entry.readonly)
            property.readonly = entry.readonly
          properties.push(property)

        } else if (entry.whichEntry === "functionProperty") {
          const property: RtoProperty = {
            name: entry.name,
            type: this.createRtoType(entry.returnType || "any"),
          }
          if (entry.optional)
            property.readonly = entry.readonly
          if (entry.readonly)
            property.readonly = entry.readonly
          properties.push(property)
        }

      }

      if (properties.length > 0)
        result.properties = properties
    }
    return result
  }

  private getBaseNamedType(name: string): RtoBaseNamedType {
    const result = this.namedTypes.get(name)
    if (!result)
      throw new Error(`Unknown named type: ${name}`)
    return result
  }
}

function findWhichTypeName(typeName: string): "special" | "primitive" | "standard" | undefined {
  if (["any", "unknown", "object", "void", "never"].includes(typeName))
    return "special"
  if (["string", "number", "bigint", "boolean", "undefined", "null", "symbol"].includes(typeName))
    return "primitive"
  if (["String", "Number", "Bigint", "Boolean", "Symbol", "Date"].includes(typeName))
    return "standard"
}

function createRtoTypeName(whichName: "special" | "primitive" | "standard" | "unresolved", refName: string): RtoTypeName {
  return {
    whichType: "name",
    whichName,
    refName
  }
}

function createRtoLocalTypeRef(refName: string): RtoLocalTypeRef {
  return {
    whichType: "localRef",
    refName
  }
}

function createRtoImportedTypeRef(ref: ImportRef): RtoImportedTypeRef {
  return {
    whichType: "importedRef",
    ...ref
  }
}



// export function typeonlyFromAst({ declarations }: TypeOnlyAst): TypeOnlyEmbeddedCode {
//   const namedTypes = {}
//   const container: TypeOnlyEmbeddedCode = {
//     whichContainer: "embedded",
//     namedTypes
//   }

//   if (declarations) {
//     const astImports = declarations.filter(isAstImport) // TODO
//     const astInterfaces = declarations.filter(isAstNamedInterface)
//     const astTypes = declarations.filter(isAstNamedType)

//     for (const astNode of astInterfaces) {
//       const namedType = analyzeAstNamedInterface(astNode, container)
//       namedTypes[namedType.name] = namedType
//     }

//     for (const astNode of astTypes) {
//       const namedType = analyzeAstNamedType(astNode, container)
//       namedTypes[namedType.name] = namedType
//     }
//   }
//   return container
// }

// function analyzeAstNamedInterface(astNode: AstNamedInterface, container: TypeOnlyGroup): NamedType {
//   const { exported, name, inlineComments, docComment, entries } = astNode
//   const interf: Interface = {
//     whichType: "interface",
//   }

//   if (entries) {
//     const indexSignature = getIndexSignature(entries)
//     if (indexSignature)
//       interf.indexSignature = indexSignature

//     const mappedIndexSignature = getMappedIndexSignature(entries)
//     if (mappedIndexSignature)
//       interf.mappedIndexSignature = mappedIndexSignature

//     const properties = getInterfaceProperties(entries)
//     if (properties)
//       interf.properties = properties
//   }

//   if (astNode.extends)
//     astNode.extends.forEach(name => addDelayedIntersection(name, interf))
//   return toNamedType(interf, {
//     exported,
//     name,
//     container,
//     inlineComments: inlineComments ? toInlineComments(inlineComments) : undefined,
//     docComment,
//   })
// }

// function getIndexSignature(astEntries: AstInterfaceEntry[]): IndexSignature | undefined {
//   const astNodes = astEntries.filter(isAstIndexSignature)
//   if (astNodes.length === 0)
//     return
//   if (astNodes.length > 1)
//     throw new Error(`Cannot have several index signature in the same interface`)
//   const astNode = astNodes[0]
//   const result: IndexSignature = {
//     keyName: astNode.keyName,
//     keyType: astNode.keyType,
//     type: analyzeAstType(astNode.type)
//   }
//   if (astNode.optional)
//     result.optional = true
//   if (astNode.readonly)
//     result.readonly = true
//   if (astNode.inlineComments)
//     result.inlineComments = toInlineComments(astNode.inlineComments)
//   if (astNode.docComment)
//     result.docComment = astNode.docComment
//   return result
// }

// function getMappedIndexSignature(astEntries: AstInterfaceEntry[]): MappedIndexSignature | undefined {
//   const astNodes = astEntries.filter(isAstMappedIndexSignature)
//   if (astNodes.length === 0)
//     return
//   if (astNodes.length > 1)
//     throw new Error(`Cannot have several index signature in the same interface`)
//   const astNode = astNodes[0]
//   const result: MappedIndexSignature = { // TODO: convert to real properties using keyInType
//     keyName: astNode.keyName,
//     keyInType: analyzeAstType(astNode.keyInType),
//     type: analyzeAstType(astNode.type)
//   }
//   if (astNode.optional)
//     result.optional = true
//   if (astNode.readonly)
//     result.readonly = true
//   if (astNode.inlineComments)
//     result.inlineComments = toInlineComments(astNode.inlineComments)
//   if (astNode.docComment)
//     result.docComment = astNode.docComment
//   return result
// }

// function getInterfaceProperties(astEntries: AstInterfaceEntry[]): Properties | undefined {
//   const astNodes = astEntries.filter(entry => isAstProperty(entry) || isAstFunctionProperty(entry))
//   if (astNodes.length === 0)
//     return
//   const list = astNodes.map(entry => {
//     if (entry.whichEntry === "property")
//       return analyzeAstProperty(entry)
//     else if (entry.whichEntry === "functionProperty")
//       return analyzeAstFunctionProperty(entry)
//     else
//       throw new Error(`Invalid interface entry: ${entry.whichEntry}`) // TODO: Add indexSignature, mappedIndexSignature
//   })
//   const properties = {}
//   for (const property of list)
//     properties[property.name] = property
//   return properties
// }

// function analyzeAstProperty(astNode: AstProperty): Property {
//   const result: Property = {
//     name: astNode.name,
//     type: analyzeAstType(astNode.type)
//   }
//   if (astNode.optional)
//     result.optional = true
//   if (astNode.readonly)
//     result.readonly = true
//   if (astNode.inlineComments)
//     result.inlineComments = toInlineComments(astNode.inlineComments)
//   if (astNode.docComment)
//     result.docComment = astNode.docComment
//   return result
// }

// function analyzeAstFunctionProperty(astNode: AstFunctionProperty): Property {
//   const result: Property = {
//     name: astNode.name,
//     type: {
//       whichType: "function",
//       returnType: astNode.returnType ? analyzeAstType(astNode.returnType) : anyType(),
//       parameters: toFunctionParameters(astNode.parameters)
//     }
//   }
//   if (astNode.optional)
//     result.optional = true
//   if (astNode.readonly)
//     result.readonly = true
//   if (astNode.inlineComments)
//     result.inlineComments = toInlineComments(astNode.inlineComments)
//   if (astNode.docComment)
//     result.docComment = astNode.docComment
//   return result
// }

// function anyType(): SpecialTypeRef {
//   return {
//     whichType: "typeRef",
//     refType: "special",
//     refName: "any"
//   }
// }

// function analyzeAstType(type: AstType): Type {
//   if (typeof type === "string")
//     return toTypeRef(type)
//   const analyze = astToTypes[type.whichType]
//   if (!analyze)
//     throw new Error(`Invalid type: ${type.whichType}`)
//   return analyze(type as any)
// }

// const specialNames = new Set<string>(["any", "unknown", "never", "object"])
// const primitiveNames = new Set<string>(["string", "number", "boolean", "undefined", "null", "symbol"])

// function toTypeRef(refName: string): TypeRef {
//   if (specialNames.has(refName)) {
//     return {
//       whichType: "typeRef",
//       refType: "special",
//       refName
//     } as SpecialTypeRef
//   }
//   if (primitiveNames.has(refName)) {
//     return {
//       whichType: "typeRef",
//       refType: "primitive",
//       refName
//     } as PrimitiveTypeRef
//   }
//   const result: GlobalTypeRef = {
//     whichType: "typeRef",
//     refType: "global",
//     refName,
//   }
//   addDelayedLocalOrImportedTypeRef(result)
//   return result
// }

// const astToTypes = {
//   literal: analyzeAstLiteralType,
//   composite: analyzeAstCompositeType,
//   interface: analyzeAstInterfaceType,
//   tuple: analyzeAstTupleType,
//   array: analyzeAstArrayType,
//   generic: analyzeAstGenericType,
//   function: analyzeAstFunctionType,
//   inlineImport: analyzeAstInlineImportType,
// }

// function analyzeAstLiteralType(astNode: AstLiteralType): LiteralType {
//   return {
//     whichType: "literal",
//     literal: astNode.literal
//   }
// }

// function analyzeAstCompositeType(astNode: AstCompositeType): Interface | UnionType {
//   if (astNode.op === "intersection")
//     return analyzeAstIntersection(astNode.types)
//   // TODO
//   return undefined as any
// }

// function analyzeAstIntersection(astNodes: AstType[]): Interface | UnionType {
//   const unions = astNodes.filter(
//     astNode => typeof astNode !== "string" && astNode.whichType === "composite" && astNode.op === "union")
//   // if (unions.length > 0) {
//   // }
//   return undefined as any
// }

// function analyzeAstInterfaceType(type: AstInterface): Interface {
//   return undefined as any
//   // TODO
// }

// function analyzeAstTupleType(astNode: AstTupleType): TupleType {
//   return {
//     whichType: "tuple",
//     itemTypes: astNode.itemTypes ? astNode.itemTypes.map(analyzeAstType) : []
//   }
// }

// function analyzeAstArrayType(astNode: AstArrayType): ArrayType {
//   const result: ArrayType = {
//     whichType: "array",
//     itemType: analyzeAstType(astNode.itemType)
//   }
//   if (astNode.genericSyntax)
//     result.genericSyntax = true
//   return result
// }

// function analyzeAstGenericType(astNode: AstGenericInstanceType): GenericInstanceType {
//   return {
//     whichType: "genericInstance",
//     genericName: astNode.name,
//     parameterTypes: astNode.parameterTypes.map(analyzeAstType)
//   }
// }

// function analyzeAstFunctionType(astNode: AstFunctionType): FunctionType {
//   return {
//     whichType: "function",
//     returnType: analyzeAstType(astNode.returnType),
//     parameters: toFunctionParameters(astNode.parameters)
//   }
// }

// function toFunctionParameters(astNodes: AstFunctionParameter[] | undefined): FunctionParameter[] {
//   if (!astNodes)
//     return []
//   return astNodes.map(({ name, type }) => {
//     const param: FunctionParameter = { name }
//     if (type)
//       param.type = analyzeAstType(type)
//     return param
//   })
// }

// function analyzeAstInlineImportType(astNode: AstInlineImportType): TypeRef {
//   const result: GlobalTypeRef = {
//     whichType: "typeRef",
//     refType: "global",
//     refName: astNode.exportedName,
//     // from: astNode.from,
//   }
//   addDelayedImportedTypeRefFromInline(result, astNode.from)
//   return result
// }

// function addDelayedIntersection(typeName: string, target: Type) {
//   // TODO
// }

// function addDelayedLocalOrImportedTypeRef(target: GlobalTypeRef) {
//   // TODO
// }

// function addDelayedImportedTypeRefFromInline(target: GlobalTypeRef, moduleName: string) {
//   // TODO
// }

// function toNamedType(type: Type, fields: NamedTypeFields): NamedType {
//   const result: NamedType = {
//     ...type,
//     name: fields.name,
//     container: fields.container
//   }
//   if (fields.exported)
//     result.exported = true
//   if (fields.inlineComments)
//     result.inlineComments = fields.inlineComments
//   if (fields.docComment)
//     result.docComment = fields.docComment
//   return result
// }

// function analyzeAstNamedType(astNode: AstNamedType, container: TypeOnlyGroup): NamedType {
//   return undefined as any // TODO
// }

// function isAstImport(decl: AstDeclaration): decl is AstImport {
//   return decl.whichDeclaration === "import"
// }

// function isAstNamedInterface(decl: AstDeclaration): decl is AstNamedInterface {
//   return decl.whichDeclaration === "interface"
// }

// function isAstNamedType(decl: AstDeclaration): decl is AstNamedType {
//   return decl.whichDeclaration === "type"
// }

// function isAstProperty(entry: AstInterfaceEntry): entry is AstProperty {
//   return entry.whichEntry === "property"
// }

// function isAstFunctionProperty(entry: AstInterfaceEntry): entry is AstFunctionProperty {
//   return entry.whichEntry === "functionProperty"
// }

// function isAstIndexSignature(entry: AstInterfaceEntry): entry is AstIndexSignature {
//   return entry.whichEntry === "indexSignature"
// }

// function isAstMappedIndexSignature(entry: AstInterfaceEntry): entry is AstMappedIndexSignature {
//   return entry.whichEntry === "mappedIndexSignature"
// }

// function toInlineComments(astInlineComments: AstInlineComment[]): string[] {
//   return astInlineComments.map(({ text }) => text)
// }
