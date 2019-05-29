export interface TypeOnlyModules {
  [path: string]: TypeOnlyModule
}

export interface TypeOnlyModule {
  whichContainer: "module"
  path: string
  namedTypes: NamedTypes
}

export interface TypeOnlyEmbeddedCode {
  whichContainer: "embedded"
  namedTypes: NamedTypes
}

export type TypeOnlyContainer = TypeOnlyModule | TypeOnlyEmbeddedCode

export interface NamedTypes {
  [name: string]: NamedType
}

export type NamedType = Type & NamedTypeFields

export type NamedTypeName = TypeName & NamedTypeFields
export type NamedGenericParameterName = GenericParameterName & NamedTypeFields
export type NamedLocalTypeRef = LocalTypeRef & NamedTypeFields
export type NamedImportedTypeRef = ImportedTypeRef & NamedTypeFields
export type NamedLiteralType = LiteralType & NamedTypeFields
export type NamedUnionType = UnionType & NamedTypeFields
export type NamedInterface = Interface & NamedTypeFields
export type NamedTupleType = TupleType & NamedTypeFields
export type NamedArrayType = ArrayType & NamedTypeFields
export type NamedGenericInstanceType = GenericInstanceType & NamedTypeFields
export type NamedFunctionType = FunctionType & NamedTypeFields
export type NamedKeyofType = KeyofType & NamedTypeFields
export type NamedMemberType = MemberType & NamedTypeFields

export type Type = TypeName
  | GenericParameterName
  | LocalTypeRef
  | ImportedTypeRef
  | LiteralType
  | UnionType
  | Interface
  | TupleType
  | ArrayType
  | GenericInstanceType
  | FunctionType
  | KeyofType
  | MemberType

export interface NamedTypeFields extends Commentable {
  exported?: boolean
  name: string
  container: TypeOnlyContainer
  generic?: GenericParameterOfNamedType[]
}

export type GenericParameter = GenericParameterOfNamedType | GenericParameterOfFunction

export interface GenericParameterOfNamedType {
  ofWhat: "named"
  name: string
  extendsType?: Type
  defaultType?: Type
  of: NamedType
}

export interface GenericParameterOfFunction {
  ofWhat: "function"
  name: string
  extendsType?: Type
  defaultType?: Type
  of: FunctionType
}

export interface TypeName {
  whichType: "name"
  whichName: "special" | "primitive" | "standard" | "unresolved"
  refName: SpecialTypeName | PrimitiveTypeName | string
}

export type SpecialTypeName = "any" | "unknown" | "object" | "void" | "never"
export type PrimitiveTypeName = "string" | "number" | "boolean" | "undefined" | "null" | "symbol"

export interface GenericParameterName {
  whichType: "genericParameter"
  genericParameter: GenericParameter
}

export interface LocalTypeRef {
  whichType: "localRef"
  ref: NamedType
}

export interface ImportedTypeRef {
  whichType: "importedRef"
  ref: NamedType
  refName: string
  from: TypeOnlyModule
}

export interface LiteralType {
  whichType: "literal"
  literal: string | number | bigint | boolean
}

export interface UnionType {
  whichType: "union"
  common?: Interface
  types: Type[]
  literals(checkTypeOf: "string"): string[]
  literals(checkTypeOf: "number"): number[]
  literals(checkTypeOf: "boolean"): boolean[]
  literals(): any[]
}

export interface TupleType {
  whichType: "tuple"
  itemTypes: Type[]
}

export interface ArrayType {
  whichType: "array"
  itemType: Type
  genericSyntax?: boolean
}

export interface GenericInstanceType {
  whichType: "genericInstance"
  genericName: string
  parameterTypes: Type[]
}

export interface FunctionType {
  whichType: "function"
  parameters: FunctionParameter[]
  returnType: Type
  generic?: GenericParameterOfFunction[]
}

export interface FunctionParameter {
  name: string
  type?: Type
}

export interface KeyofType {
  whichType: "keyof"
  type: Type
}

export interface MemberType {
  whichType: "member"
  type: Type
  memberName: string | MemberNameLiteral
}

export interface MemberNameLiteral {
  literal: string | number
}

export interface Interface {
  whichType: "interface"
  indexSignature?: IndexSignature
  mappedIndexSignature?: MappedIndexSignature
  properties?: Properties
}

export interface Properties {
  [name: string]: Property
}

export interface Property extends Commentable {
  name: string
  type: Type
  optional?: boolean
  readonly?: boolean
}

export interface IndexSignature extends Commentable {
  keyName: string
  keyType: "string" | "number"
  type: Type
  optional?: boolean
  readonly?: boolean
}

export interface MappedIndexSignature extends Commentable {
  keyName: string
  keyInType: Type
  type: Type
  optional?: boolean
  readonly?: boolean
}

export interface Commentable {
  /**
   * A multiline string.
   */
  docComment?: string
  inlineComments?: string[]
}
