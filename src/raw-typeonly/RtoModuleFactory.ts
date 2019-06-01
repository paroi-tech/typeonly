import { AstArrayType, AstCompositeType, AstDeclaration, AstFunctionParameter, AstFunctionProperty, AstFunctionType, AstGenericInstance, AstGenericParameter, AstIndexSignature, AstInlineImportType, AstInterface, AstKeyofType, AstLiteralType, AstMappedIndexSignature, AstMemberType, AstNamedInterface, AstNamedType, AstProperty, AstTupleType, AstType, TypeOnlyAst } from "../ast"
import { RtoArrayType, RtoBaseNamedType, RtoCompositeType, RtoFunctionParameter, RtoFunctionType, RtoGenericInstance, RtoGenericParameter, RtoImportedTypeRef, RtoIndexSignature, RtoInterface, RtoKeyofType, RtoLiteralType, RtoLocalTypeRef, RtoMappedIndexSignature, RtoMemberType, RtoModule, RtoNamedType, RtoProperty, RtoTupleType, RtoType, RtoTypeName } from "../rto"
import ImportTool, { ImportRef } from "./ImportTool"
import InlineImportScanner from "./InlineImportScanner"
import { ModuleLoader } from "./Project"

export default class RtoModuleFactory {
  private rtoTypeCreators: {
    [K in Exclude<AstType, string>["whichType"]]: (astNode: any) => RtoType
  } = {
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
  private namedTypeList: RtoBaseNamedType[] = []
  private namedTypes = new Map<string, RtoBaseNamedType>()
  private importTool?: ImportTool
  private module?: RtoModule

  constructor(private ast: TypeOnlyAst, private pathInProject?: string) {
    if (this.ast.declarations)
      this.ast.declarations.forEach(astDecl => this.registerAstDeclaration(astDecl))
  }

  hasExportedNamedType(name: string): boolean {
    const namedType = this.namedTypes.get(name)
    return !!(namedType && namedType.exported)
  }

  getModulePath(): string {
    if (!this.pathInProject)
      throw new Error(`Missing module path`)
    return this.pathInProject
  }

  async loadImports(moduleLoader: ModuleLoader) {
    this.importTool = new ImportTool(this.getModulePath(), moduleLoader)
    if (this.ast.declarations) {
      const inlineScanner = new InlineImportScanner(this.importTool)
      for (const astDecl of this.ast.declarations) {
        if (astDecl.whichDeclaration === "import")
          this.importTool.addImport(astDecl)
        else if (astDecl.whichDeclaration === "interface")
          inlineScanner.scan(astDecl)
        else if (astDecl.whichDeclaration === "type")
          inlineScanner.scan(astDecl.type)
        else if (astDecl.whichDeclaration !== "comment")
          throw new Error(`Invalid whichDeclaration: ${astDecl!.whichDeclaration}`)
      }
    }
    await this.importTool.load()
  }

  getRtoModule(): RtoModule {
    if (!this.module)
      this.module = this.createRtoModule()
    return this.module
  }

  private createRtoModule(): RtoModule {
    if (this.ast.declarations) {
      this.ast.declarations.forEach(astDecl => {
        if (astDecl.whichDeclaration === "interface" || astDecl.whichDeclaration === "type")
          this.fillAstNamed(astDecl)
        else if (astDecl.whichDeclaration === "import" && !this.importTool)
          throw new Error(`Imports are not loaded`)
      })
    }
    const module: RtoModule = {}
    if (this.importTool) {
      module.path = this.importTool.path
      Object.assign(module, this.importTool.createRtoImports())
    }
    if (this.namedTypeList.length > 0)
      module.namedTypes = this.namedTypeList as RtoNamedType[]
    return module
  }

  private registerAstDeclaration(astNode: AstDeclaration) {
    switch (astNode.whichDeclaration) {
      case "interface":
      case "type":
        const namedType = this.createRtoBaseNamedType(astNode)
        this.namedTypes.set(namedType.name, namedType)
        this.namedTypeList.push(namedType)
        break
      case "import":
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
    if (astNode.generic)
      result.generic = this.createRtoGenericParameters(astNode.generic)
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
      if (this.importTool) {
        const importRef = this.importTool.findImportedMember(astNode)
        if (importRef)
          return createRtoImportedTypeRef(importRef)
      }
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
    const type: RtoTupleType = {
      whichType: "tuple",
    }
    if (astNode.itemTypes)
      type.itemTypes = astNode.itemTypes.map(child => this.createRtoType(child))
    return type
  }

  private createRtoFunctionType(astNode: AstFunctionType): RtoFunctionType {
    const type: RtoFunctionType = {
      whichType: "function",
      returnType: this.createRtoType(astNode.returnType),
    }
    if (astNode.parameters)
      type.parameters = this.createRtoFunctionParameters(astNode.parameters)
    if (astNode.generic)
      type.generic = this.createRtoGenericParameters(astNode.generic)
    return type
  }

  private createRtoFunctionParameters(astNodes: AstFunctionParameter[]): RtoFunctionParameter[] {
    return astNodes.map(({ name, type }) => {
      const param: RtoFunctionParameter = { name }
      if (type)
        param.type = this.createRtoType(type)
      return param
    })
  }

  private createRtoGenericParameters(astNodes: AstGenericParameter[]): RtoGenericParameter[] {
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
    if (!this.importTool)
      throw new Error(`Imports are not loaded`)
    return createRtoImportedTypeRef(this.importTool.inlineImport(astNode))
  }

  private createRtoInterface(astNode: AstInterface): RtoInterface {
    const result: RtoInterface = {
      whichType: "interface"
    }
    if (astNode.entries) {
      for (const entry of astNode.entries) {
        if (entry.whichEntry === "indexSignature") {
          // if (result.indexSignature || result.mappedIndexSignature)
          //   throw new Error(`An interface cannot have several index signatures`)
          result.indexSignature = this.createRtoIndexSignature(entry)
        } else if (entry.whichEntry === "mappedIndexSignature") {
          // if (result.indexSignature || result.mappedIndexSignature || result.properties)
          //   throw new Error(`An interface cannot have other entries with a mapped index signature`)
          result.mappedIndexSignature = this.createRtoMappedIndexSignature(entry)
        } else if (entry.whichEntry === "property") {
          // if (result.mappedIndexSignature)
          //   throw new Error(`An interface cannot have other entries with a mapped index signature`)
          if (!result.properties)
            result.properties = []
          result.properties.push(this.createRtoProperty(entry))
        } else if (entry.whichEntry === "functionProperty") {
          // if (result.mappedIndexSignature)
          //   throw new Error(`An interface cannot have other entries with a mapped index signature`)
          if (!result.properties)
            result.properties = []
          result.properties.push(this.createRtoPropertyFromFunctionProperty(entry))
        }
      }
    }
    return result
  }

  private createRtoProperty(entry: AstProperty): RtoProperty {
    const property: RtoProperty = {
      name: entry.name,
      type: this.createRtoType(entry.type),
    }
    if (entry.optional)
      property.optional = entry.optional
    if (entry.readonly)
      property.readonly = entry.readonly
    if (entry.docComment)
      property.docComment = entry.docComment
    return property
  }

  private createRtoPropertyFromFunctionProperty(entry: AstFunctionProperty): RtoProperty {
    const type: RtoFunctionType = {
      whichType: "function",
      returnType: this.createRtoType(entry.returnType || "any"),
    }
    if (entry.parameters)
      type.parameters = this.createRtoFunctionParameters(entry.parameters)
    if (entry.generic)
      type.generic = this.createRtoGenericParameters(entry.generic)
    const property: RtoProperty = {
      name: entry.name,
      type,
    }
    if (entry.optional)
      property.optional = entry.optional
    if (entry.readonly)
      property.readonly = entry.readonly
    if (entry.docComment)
      property.docComment = entry.docComment
    return property
  }

  private createRtoIndexSignature(entry: AstIndexSignature): RtoIndexSignature {
    const indexSignature: RtoIndexSignature = {
      keyName: entry.keyName,
      keyType: entry.keyType,
      type: this.createRtoType(entry.type)
    }
    if (entry.optional)
      indexSignature.optional = entry.optional
    if (entry.readonly)
      indexSignature.readonly = entry.readonly
    if (entry.docComment)
      indexSignature.docComment = entry.docComment
    return indexSignature
  }

  private createRtoMappedIndexSignature(entry: AstMappedIndexSignature): RtoMappedIndexSignature {
    const mappedIndexSignature: RtoMappedIndexSignature = {
      keyName: entry.keyName,
      keyInType: this.createRtoType(entry.keyInType),
      type: this.createRtoType(entry.type)
    }
    if (entry.optional)
      mappedIndexSignature.optional = entry.optional
    if (entry.readonly)
      mappedIndexSignature.readonly = entry.readonly
    if (entry.docComment)
      mappedIndexSignature.docComment = entry.docComment
    return mappedIndexSignature
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
//     const astImports = declarations.filter(isAstImport)
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
//   const result: MappedIndexSignature = {
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
//       throw new Error(`Invalid interface entry: ${entry.whichEntry}`)
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
//
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
//
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
//
// }

// function addDelayedLocalOrImportedTypeRef(target: GlobalTypeRef) {
//
// }

// function addDelayedImportedTypeRefFromInline(target: GlobalTypeRef, moduleName: string) {
//
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
//   return undefined as any
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
