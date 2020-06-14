export interface Modules {
  [modulePath: string]: Module
}

/**
 * TypeOnly Module
 */
export interface Module {
  path?: string
  imports?: Import[]
  namespacedImports?: NamespacedImport[]
  namedTypes: NamedTypes
}

export interface Import {
  from: Module
  namedMembers?: ImportNamedMembers
}

export interface ImportNamedMembers {
  [as: string]: NamedType
}

export interface NamespacedImport {
  from: Module
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
  kind: "name"
  group: "ts" | "primitive" | "global"
  refName: SpecialTypeName | PrimitiveTypeName | string
}

export type SpecialTypeName = "any" | "unknown" | "object" | "void" | "never"
export type PrimitiveTypeName = "string" | "number" | "bigint" | "boolean" | "undefined" | "null" | "symbol"

export interface GenericParameterName {
  kind: "genericParameterName"
  genericParameterName: string
}

export interface LocalTypeRef {
  kind: "localRef"
  refName: string
  ref: NamedType
}

export interface ImportedTypeRef {
  kind: "importedRef"
  refName: string
  namespace?: string
  ref: NamedType
}

export interface LiteralType {
  kind: "literal"
  literal: string | number | bigint | boolean
}

export interface CompositeType {
  kind: "composite"
  op: "union" | "intersection"
  types: Type[]
}

export interface TupleType {
  kind: "tuple"
  itemTypes: Type[]
}

export interface ArrayType {
  kind: "array"
  itemType: Type
}

export interface GenericInstance {
  kind: "genericInstance"
  genericName: string
  parameterTypes: Type[]
}

export interface FunctionType {
  kind: "function"
  parameters: FunctionParameter[]
  returnType: Type
  generic?: GenericParameter[]
}

export interface FunctionParameter {
  name: string
  type: Type
}

export interface KeyofType {
  kind: "keyof"
  type: Type
}

export interface MemberType {
  kind: "member"
  parentType: Type
  memberName: string | MemberNameLiteral
}

export interface MemberNameLiteral {
  literal: string | number
}

export interface Interface {
  kind: "interface"
  indexSignature?: IndexSignature
  mappedIndexSignature?: MappedIndexSignature
  properties?: Properties
}

export interface Properties {
  [name: string]: Property
}

export interface Property extends Commentable {
  of: Interface
  name: string
  type: Type
  optional: boolean
  readonly: boolean
}

export interface IndexSignature extends Commentable {
  of: Interface
  keyName: string
  keyType: "string" | "number"
  type: Type
  optional: boolean
  readonly: boolean
}

export interface MappedIndexSignature extends Commentable {
  of: Interface
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
