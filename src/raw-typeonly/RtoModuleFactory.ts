import { AstArrayType, AstCompositeType, AstDeclaration, AstFunctionParameter, AstFunctionProperty, AstFunctionType, AstGenericInstanceType, AstImport, AstIndexSignature, AstInlineComment, AstInlineImportType, AstInterface, AstInterfaceEntry, AstLiteralType, AstMappedIndexSignature, AstNamedInterface, AstNamedType, AstProperty, AstTupleType, AstType, TypeOnlyAst } from "../ast"
import { RtoNamedType } from "../rto"
import Project from "./Project"

export default class RtoModuleFactory {
  namedTypes: RtoNamedType[] = []

  constructor(private project: Project, { declarations }: TypeOnlyAst, public path?: string) {
  }

  // private createRtoNamedTypes(declarations:  )
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
