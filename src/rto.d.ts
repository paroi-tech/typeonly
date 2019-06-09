export interface RtoModules {
  [modulePath: string]: RtoModule
}

/**
 * Raw TypeOnly Module
 */
export interface RtoModule {
  imports?: RtoImport[]
  namespacedImports?: RtoNamespacedImport[]
  namedTypes?: RtoNamedType[]
}

export interface RtoImport {
  from: string
  namedMembers?: RtoImportNamedMember[]
}

export interface RtoImportNamedMember {
  name: string
  as?: string
}

export interface RtoNamespacedImport {
  from: string
  asNamespace: string
}

export type RtoNamedType = RtoType & RtoBaseNamedType

export type RtoNamedTypeName = RtoTypeName & RtoBaseNamedType
export type RtoNamedGenericParameterName = RtoGenericParameterName & RtoBaseNamedType
export type RtoNamedLocalTypeRef = RtoLocalTypeRef & RtoBaseNamedType
export type RtoNamedImportedTypeRef = RtoImportedTypeRef & RtoBaseNamedType
export type RtoNamedLiteralType = RtoLiteralType & RtoBaseNamedType
export type RtoNamedCompositeType = RtoCompositeType & RtoBaseNamedType
export type RtoNamedTupleType = RtoTupleType & RtoBaseNamedType
export type RtoNamedArrayType = RtoArrayType & RtoBaseNamedType
export type RtoNamedGenericInstance = RtoGenericInstance & RtoBaseNamedType
export type RtoNamedFunctionType = RtoFunctionType & RtoBaseNamedType
export type RtoNamedKeyofType = RtoKeyofType & RtoBaseNamedType
export type RtoNamedMemberType = RtoMemberType & RtoBaseNamedType
export type RtoNamedInterface = RtoInterface & RtoBaseNamedType

export type RtoType = RtoTypeName
  | RtoGenericParameterName
  | RtoLocalTypeRef
  | RtoImportedTypeRef
  | RtoLiteralType
  | RtoCompositeType
  | RtoTupleType
  | RtoArrayType
  | RtoGenericInstance
  | RtoFunctionType
  | RtoKeyofType
  | RtoMemberType
  | RtoInterface

export interface RtoBaseNamedType extends RtoCommentable {
  exported?: boolean
  name: string
  generic?: RtoGenericParameter[]
}

export interface RtoGenericParameter {
  name: string
  extendsType?: RtoType
  defaultType?: RtoType
}

export interface RtoTypeName {
  kind: "name"
  group: "ts" | "primitive" | "global"
  refName: RtoSpecialTypeName | RtoPrimitiveTypeName | string
}

export type RtoSpecialTypeName = "any" | "unknown" | "object" | "void" | "never"
export type RtoPrimitiveTypeName = "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "null"

export interface RtoGenericParameterName {
  kind: "genericParameterName"
  genericParameterName: string
}

export interface RtoLocalTypeRef {
  kind: "localRef"
  refName: string
}

export interface RtoImportedTypeRef {
  kind: "importedRef"
  refName: string
  namespace?: string
}

export interface RtoLiteralType {
  kind: "literal"
  literal: string | number | bigint | boolean
}

export interface RtoCompositeType {
  kind: "composite"
  op: "union" | "intersection"
  types: RtoType[]
}

export interface RtoTupleType {
  kind: "tuple"
  itemTypes?: RtoType[]
}

export interface RtoArrayType {
  kind: "array"
  itemType: RtoType
}

export interface RtoGenericInstance {
  kind: "genericInstance"
  genericName: string
  parameterTypes: RtoType[]
}

export interface RtoFunctionType {
  kind: "function"
  parameters?: RtoFunctionParameter[]
  returnType: RtoType
  generic?: RtoGenericParameter[]
}

export interface RtoFunctionParameter {
  name: string
  type?: RtoType
}

export interface RtoKeyofType {
  kind: "keyof"
  type: RtoType
}

export interface RtoMemberType {
  kind: "member"
  parentType: RtoType
  memberName: string | RtoMemberNameLiteral
}

export interface RtoMemberNameLiteral {
  literal: string | number
}

export interface RtoInterface {
  kind: "interface"
  indexSignature?: RtoIndexSignature
  mappedIndexSignature?: RtoMappedIndexSignature
  properties?: RtoProperty[]
}

export interface RtoProperty extends RtoCommentable {
  name: string
  type: RtoType
  optional?: boolean
  readonly?: boolean
}

export interface RtoIndexSignature extends RtoCommentable {
  keyName: string
  keyType: "string" | "number"
  type: RtoType
  optional?: boolean
  readonly?: boolean
}

export interface RtoMappedIndexSignature extends RtoCommentable {
  keyName: string
  keyInType: RtoType
  type: RtoType
  optional?: boolean
  readonly?: boolean
}

export interface RtoCommentable {
  /**
   * A multiline string.
   */
  docComment?: string
}
