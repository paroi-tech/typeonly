export type TypeOnlyContainer = TypeOnlyEmbeddedCode | TypeOnlyModule

export interface TypeOnlyEmbeddedCode {
  containerType: "embedded"
  namedTypes: NamedTypes
}

export interface TypeOnlyModules {
  [name: string]: TypeOnlyModule
}

export interface TypeOnlyModule {
  containerType: "module"
  name: string
  namedTypes: NamedTypes
}

export interface NamedTypes {
  [name: string]: NamedType
}

export type NamedType = Type & NamedTypeFields

export type NamedTypeRef = TypeRef & NamedTypeFields
export type NamedLiteralType = LiteralType & NamedTypeFields
export type NamedUnionType = UnionType & NamedTypeFields
export type NamedInterface = Interface & NamedTypeFields
export type NamedTupleType = TupleType & NamedTypeFields
export type NamedArrayType = ArrayType & NamedTypeFields
export type NamedGenericType = GenericType & NamedTypeFields
export type NamedFunctionType = FunctionType & NamedTypeFields

export interface NamedTypeFields extends Commentable {
  exported?: boolean
  name: string
  container: TypeOnlyContainer
}

export type Type = TypeRef
  | LiteralType
  | UnionType
  | Interface
  | TupleType
  | ArrayType
  | GenericType
  | FunctionType

export type TypeRef = SpecialTypeRef | PrimitiveTypeRef | GlobalTypeRef | LocalTypeRef | ImportedTypeRef

export interface SpecialTypeRef {
  whichType: "typeRef"
  refType: "special"
  refName: SpecialTypeName
}

export interface PrimitiveTypeRef {
  whichType: "typeRef"
  refType: "primitive"
  refName: PrimitiveTypeName
}

export interface GlobalTypeRef {
  whichType: "typeRef"
  refType: "global"
  refName: string
}

export interface LocalTypeRef {
  whichType: "typeRef"
  refType: "local"
  refName: string
  ref: NamedType
}

export interface ImportedTypeRef {
  whichType: "typeRef"
  refType: "imported"
  refName: string
  ref: NamedType
  from: string
}

export type SpecialTypeName = "any" | "unknown" | "never" | "object"
export type PrimitiveTypeName = "string" | "number" | "boolean" | "undefined" | "null" | "symbol"

export interface LiteralType {
  whichType: "literal"
  value: string | number | bigint | boolean
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

export interface GenericType {
  whichType: "generic"
  genericName: string
  parameterTypes: Type[]
}

export interface FunctionType {
  whichType: "function"
  parameters: FunctionParameter[]
  returnType: Type
}

export interface FunctionParameter {
  name: string
  type?: Type
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
