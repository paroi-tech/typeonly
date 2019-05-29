/**
 * Raw TypeOnly Module
 */
export interface RtoModule {
  path?: string
  namedTypes: RtoNamedType[]
}

export type RtoNamedType = RtoType & RtoNamedTypeFields

// export type RtoNamedTypeName = RtoTypeName & RtoNamedTypeFields
// export type RtoNamedGenericParameterName = RtoGenericParameterName & RtoNamedTypeFields
// export type RtoNamedRef = RtoRef & RtoNamedTypeFields
// export type RtoNamedLiteralType = RtoLiteralType & RtoNamedTypeFields
// export type RtoNamedUnionType = RtoUnionType & RtoNamedTypeFields
// export type RtoNamedInterface = RtoInterface & RtoNamedTypeFields
// export type RtoNamedTupleType = RtoTupleType & RtoNamedTypeFields
// export type RtoNamedArrayType = RtoArrayType & RtoNamedTypeFields
// export type RtoNamedGenericInstanceType = RtoGenericInstanceType & RtoNamedTypeFields
// export type RtoNamedFunctionType = RtoFunctionType & RtoNamedTypeFields
// export type RtoNamedKeyofType = RtoKeyofType & RtoNamedTypeFields
// export type RtoNamedMemberType = RtoMemberType & RtoNamedTypeFields

export type RtoType = RtoTypeName
  | RtoGenericParameterName
  | RtoRef
  | RtoLiteralType
  | RtoUnionType
  | RtoTupleType
  | RtoArrayType
  | RtoGenericInstanceType
  | RtoFunctionType
  | RtoKeyofGenericType
  | RtoMemberType
  | RtoInterface

export interface RtoNamedTypeFields extends RtoCommentable {
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
  whichName: "special" | "primitive" | "standard" | "unresolved"
  refName: RtoSpecialTypeName | RtoPrimitiveTypeName | string
}

export type RtoSpecialTypeName = "any" | "unknown" | "object" | "void" | "never"
export type RtoPrimitiveTypeName = "string" | "number" | "boolean" | "undefined" | "null" | "symbol"

export interface RtoGenericParameterName {
  whichType: "genericParameter"
  genericParameterName: string
}

export type RtoRef = RtoLocalTypeRef | RtoImportedTypeRef

export interface RtoLocalTypeRef {
  whichType: "ref"
  whichRef: "local"
  refName: string
}

export interface RtoImportedTypeRef {
  whichType: "ref"
  whichRef: "imported"
  ref: RtoNamedType
  refName: string
  fromPath: string
}

export interface RtoLiteralType {
  whichType: "literal"
  literal: string | number | bigint | boolean
}

export interface RtoUnionType {
  whichType: "union"
  types: RtoType[]
}

export interface RtoTupleType {
  whichType: "tuple"
  itemTypes: RtoType[]
}

export interface RtoArrayType {
  whichType: "array"
  itemType: RtoType
  genericSyntax?: boolean
}

export interface RtoGenericInstanceType {
  whichType: "genericInstance"
  genericName: string
  parameterTypes: RtoType[]
}

export interface RtoFunctionType {
  whichType: "function"
  parameters: RtoFunctionParameter[]
  returnType: RtoType
  generic?: RtoGenericParameter[]
}

export interface RtoFunctionParameter {
  name: string
  type?: RtoType
}

export interface RtoKeyofGenericType {
  whichType: "keyof"
  genericParameterName: string
}

export interface RtoMemberType {
  whichType: "member"
  type: RtoType
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
  inlineComments?: string[]
}
