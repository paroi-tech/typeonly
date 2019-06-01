/**
 * TypeOnly Module
 */
export interface Module {
  path?: string
  imports?: Import[]
  namespacedImports?: NamespacedImport[]
  namedTypes: NamedTypes
  findExportedType(name: string): NamedType | undefined
  getExportedType(name: string): NamedType
}

export interface Import {
  from: string
  namedMembers?: ImportNamedMembers
}

export interface ImportNamedMembers {
  [as: string]: NamedType
}

export interface NamespacedImport {
  from: string
  asNamespace: string
}

export interface NamedTypes {
  [name: string]: NamedType
}

export type NamedType = Type & BaseNamedType

export type NamedTypeName = TypeName & BaseNamedType
export type NamedGenericParameterName = GenericParameterName & BaseNamedType
export type NamedLocalTypeRef = LocalTypeRef & BaseNamedType
export type NamedImportedTypeRef = ImportedTypeRef & BaseNamedType
export type NamedLiteralType = LiteralType & BaseNamedType
export type NamedCompositeType = CompositeType & BaseNamedType
export type NamedTupleType = TupleType & BaseNamedType
export type NamedArrayType = ArrayType & BaseNamedType
export type NamedGenericInstance = GenericInstance & BaseNamedType
export type NamedFunctionType = FunctionType & BaseNamedType
export type NamedKeyofType = KeyofType & BaseNamedType
export type NamedMemberType = MemberType & BaseNamedType
export type NamedInterface = Interface & BaseNamedType

export type Type = TypeName
  | GenericParameterName
  | LocalTypeRef
  | ImportedTypeRef
  | LiteralType
  | CompositeType
  | TupleType
  | ArrayType
  | GenericInstance
  | FunctionType
  | KeyofType
  | MemberType
  | Interface

export interface BaseNamedType extends Commentable {
  module: Module
  exported: boolean
  name: string
  generic?: GenericParameter[]
}

export interface GenericParameter {
  name: string
  extendsType?: Type
  defaultType?: Type
}

export interface TypeName {
  whichType: "name"
  kindOfName: "ts" | "primitive" | "standard" | "global"
  refName: SpecialTypeName | PrimitiveTypeName | string
}

export type SpecialTypeName = "any" | "unknown" | "object" | "void" | "never"
export type PrimitiveTypeName = "string" | "number" | "bigint" | "boolean" | "undefined" | "null" | "symbol"

export interface GenericParameterName {
  whichType: "genericParameterName"
  genericParameterName: string
}

export interface LocalTypeRef {
  whichType: "localRef"
  refName: string
  ref: NamedType
}

export interface ImportedTypeRef {
  whichType: "importedRef"
  refName: string
  namespace?: string
  ref: NamedType
}

export interface LiteralType {
  whichType: "literal"
  literal: string | number | bigint | boolean
}

export interface CompositeType {
  whichType: "composite"
  op: "union" | "intersection"
  types: Type[]
}

export interface TupleType {
  whichType: "tuple"
  itemTypes: Type[]
}

export interface ArrayType {
  whichType: "array"
  itemType: Type
}

export interface GenericInstance {
  whichType: "genericInstance"
  genericName: string
  parameterTypes: Type[]
}

export interface FunctionType {
  whichType: "function"
  parameters: FunctionParameter[]
  returnType: Type
  generic?: GenericParameter[]
}

export interface FunctionParameter {
  name: string
  type: Type
}

export interface KeyofType {
  whichType: "keyof"
  type: Type
}

export interface MemberType {
  whichType: "member"
  parentType: Type
  memberName: string | MemberNameLiteral
}

export interface MemberNameLiteral {
  literal: string | number
}

export interface Interface {
  whichType: "interface"
  indexSignature?: IndexSignature
  mappedIndexSignature?: MappedIndexSignature
  properties: Properties
}

export interface Properties {
  [name: string]: Property
}

export interface Property extends Commentable {
  name: string
  type: Type
  optional: boolean
  readonly: boolean
}

export interface IndexSignature extends Commentable {
  keyName: string
  keyType: "string" | "number"
  type: Type
  optional: boolean
  readonly: boolean
}

export interface MappedIndexSignature extends Commentable {
  keyName: string
  keyInType: Type
  type: Type
  optional: boolean
  readonly: boolean
}

export interface Commentable {
  /**
   * A multiline string.
   */
  docComment?: string
}
