/**
 * Raw TypeOnly Module
 */
export interface RtoModule {
  path?: string
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
  whichType: "name"
  kindOfName: "ts" | "primitive" | "standard" | "global"
  refName: RtoSpecialTypeName | RtoPrimitiveTypeName | string
}

export type RtoSpecialTypeName = "any" | "unknown" | "object" | "void" | "never"
export type RtoPrimitiveTypeName = "string" | "number" | "bigint" | "boolean" | "undefined" | "null" | "symbol"

export interface RtoGenericParameterName {
  whichType: "genericParameterName"
  genericParameterName: string
}

export interface RtoLocalTypeRef {
  whichType: "localRef"
  refName: string
}

export interface RtoImportedTypeRef {
  whichType: "importedRef"
  refName: string
  namespace?: string
}

export interface RtoLiteralType {
  whichType: "literal"
  literal: string | number | bigint | boolean
}

export interface RtoCompositeType {
  whichType: "composite"
  op: "union" | "intersection"
  types: RtoType[]
}

export interface RtoTupleType {
  whichType: "tuple"
  itemTypes?: RtoType[]
}

export interface RtoArrayType {
  whichType: "array"
  itemType: RtoType
}

export interface RtoGenericInstance {
  whichType: "genericInstance"
  genericName: string
  parameterTypes: RtoType[]
}

export interface RtoFunctionType {
  whichType: "function"
  parameters?: RtoFunctionParameter[]
  returnType: RtoType
  generic?: RtoGenericParameter[]
}

export interface RtoFunctionParameter {
  name: string
  type?: RtoType
}

export interface RtoKeyofType {
  whichType: "keyof"
  type: RtoType
}

export interface RtoMemberType {
  whichType: "member"
  parentType: RtoType
  memberName: string | RtoMemberNameLiteral
}

export interface RtoMemberNameLiteral {
  literal: string | number
}

export interface RtoInterface {
  whichType: "interface"
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
