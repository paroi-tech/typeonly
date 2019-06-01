export interface TypeOnlyAst {
  declarations?: AstDeclaration[]
}

export type AstDeclaration = AstImport
  | AstNamedInterface
  | AstNamedType
  | AstStandaloneComment

export type AstImport = AstClassicImport | AstNamespacedImport

export interface AstClassicImport extends AstCommentable {
  whichDeclaration: "import"
  whichImport: "classic"
  from: string
  // defaultName?: string
  namedMembers?: AstImportNamedMember[]
}

export interface AstImportNamedMember {
  name: string
  as?: string
}

export interface AstNamespacedImport extends AstCommentable {
  whichDeclaration: "import"
  whichImport: "namespaced"
  from: string
  asNamespace: string
}

export interface AstInterface {
  whichType: "interface"
  entries?: AstInterfaceEntry[]
}

export interface AstNamedInterface extends AstInterface, AstCommentable {
  whichDeclaration: "interface"
  name: string
  exported?: boolean
  extends?: string[]
  generic?: AstGenericParameter[]
}

export type AstInterfaceEntry = AstProperty
  | AstFunctionProperty
  | AstIndexSignature
  | AstMappedIndexSignature
  | AstStandaloneInterfaceComment

export interface AstProperty extends AstCommentable {
  whichEntry: "property"
  optional?: boolean
  readonly?: boolean
  name: string
  type: AstType
}

export interface AstFunctionProperty extends AstCommentable {
  whichEntry: "functionProperty"
  optional?: boolean
  readonly?: boolean
  name: string
  parameters?: AstFunctionParameter[]
  returnType?: AstType
  generic?: AstGenericParameter[]
}

export interface AstIndexSignature extends AstCommentable {
  whichEntry: "indexSignature"
  keyName: string
  keyType: "string" | "number"
  type: AstType
  optional?: boolean
  readonly?: boolean
}

export interface AstMappedIndexSignature extends AstCommentable {
  whichEntry: "mappedIndexSignature"
  keyName: string
  keyInType: AstType
  type: AstType
  optional?: boolean
  readonly?: boolean
}

export interface AstNamedType extends AstCommentable {
  whichDeclaration: "type"
  name: string
  type: AstType
  exported?: boolean
  generic?: AstGenericParameter[]
}

export type AstType = string
  | AstLiteralType
  | AstInterface
  | AstCompositeType
  | AstTupleType
  | AstArrayType
  | AstGenericInstance
  | AstFunctionType
  | AstKeyofType
  | AstMemberType
  | AstInlineImportType

export interface AstLiteralType {
  whichType: "literal"
  literal: string | number | boolean | bigint
  stringDelim?: "\"" | "'" | "`"
}

export interface AstCompositeType {
  whichType: "composite"
  op: "union" | "intersection"
  types: AstType[]
}

export interface AstTupleType {
  whichType: "tuple"
  itemTypes?: AstType[]
}

export interface AstArrayType {
  whichType: "array"
  itemType: AstType
  genericSyntax?: boolean
}

export interface AstGenericInstance {
  whichType: "genericInstance"
  genericName: string
  parameterTypes: AstType[]
}

export interface AstFunctionType {
  whichType: "function"
  parameters?: AstFunctionParameter[]
  returnType: AstType
  generic?: AstGenericParameter[]
}

export interface AstFunctionParameter {
  name: string
  type?: AstType
}

export interface AstKeyofType {
  whichType: "keyof"
  type: AstType
}

export interface AstMemberType {
  whichType: "member"
  parentType: AstType
  memberName: string | AstMemberNameLiteral
}

export interface AstMemberNameLiteral {
  literal: string | number
  stringDelim?: "\"" | "'" | "`"
}

export interface AstInlineImportType {
  whichType: "inlineImport"
  from: string
  exportedName: string
}

export interface AstGenericParameter {
  name: string
  extendsType?: AstType
  defaultType?: AstType
}

export interface AstStandaloneComment {
  whichDeclaration: "comment"
  /**
   * A multiline string.
   */
  text: string
  syntax: "inline" | "classic"
}

export interface AstStandaloneInterfaceComment {
  whichEntry: "comment"
  /**
   * A multiline string.
   */
  text: string
  syntax: "inline" | "classic"
}

export interface AstCommentable {
  /**
   * A multiline string.
   */
  docComment?: string
  inlineComments?: AstInlineComment[]
}

export interface AstInlineComment {
  /**
   * A single line string.
   */
  text: string
  syntax: "inline" | "classic"
}