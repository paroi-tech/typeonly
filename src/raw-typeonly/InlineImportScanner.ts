import { AstArrayType, AstCompositeType, AstFunctionParameter, AstFunctionProperty, AstFunctionType, AstGenericInstance, AstGenericParameter, AstIndexSignature, AstInlineImportType, AstInterface, AstKeyofType, AstLiteralType, AstMappedIndexSignature, AstMemberType, AstProperty, AstTupleType, AstType } from "../ast"
import ImportTool from "./ImportTool"

export default class InlineImportScanner {
  private typeScans: {
    [K in Exclude<AstType, string>["whichType"]]: (astNode: any) => void
  } = {
      inlineImport: astNode => this.registerInlineImport(astNode),
      literal: () => { },
      array: astNode => this.scanArrayType(astNode),
      tuple: astNode => this.scanTupleType(astNode),
      keyof: astNode => this.scanKeyofType(astNode),
      member: astNode => this.scanMemberType(astNode),
      composite: astNode => this.scanCompositeType(astNode),
      genericInstance: astNode => this.scanGenericInstance(astNode),
      function: astNode => this.scanFunctionType(astNode),
      interface: astNode => this.scanInterface(astNode),
    }

  constructor(private importTool: ImportTool) {
  }

  scan(astNode: AstType): void {
    if (typeof astNode === "string")
      return
    const scan = this.typeScans[astNode.whichType]
    if (!scan)
      throw new Error(`Unexpected whichType to scan: ${astNode.whichType}`)
    return scan(astNode)
  }

  private registerInlineImport(astNode: AstInlineImportType) {
    this.importTool.addInlineImport(astNode)
  }

  private scanArrayType(astNode: AstArrayType) {
    this.scan(astNode.itemType)
  }

  private scanCompositeType(astNode: AstCompositeType) {
    astNode.types.forEach(child => this.scan(child))
  }

  private scanGenericInstance(astNode: AstGenericInstance) {
    astNode.parameterTypes.forEach(child => this.scan(child))
  }

  private scanKeyofType(astNode: AstKeyofType) {
    this.scan(astNode.type)
  }

  private scanMemberType(astNode: AstMemberType) {
    this.scan(astNode.parentType)
  }

  private scanTupleType(astNode: AstTupleType) {
    if (astNode.itemTypes)
      astNode.itemTypes.forEach(child => this.scan(child))
  }

  private scanFunctionType(astNode: AstFunctionType) {
    this.scan(astNode.returnType)
    if (astNode.parameters)
      this.scanFunctionParameters(astNode.parameters)
    if (astNode.generic)
      this.scanGenericParameters(astNode.generic)
  }

  private scanFunctionParameters(astNodes: AstFunctionParameter[]) {
    return astNodes.forEach(({ type }) => {
      if (type)
        this.scan(type)
    })
  }

  private scanGenericParameters(astNodes: AstGenericParameter[]) {
    return astNodes.forEach(({ extendsType, defaultType }) => {
      if (extendsType)
        this.scan(extendsType)
      if (defaultType)
        this.scan(defaultType)
    })
  }

  private scanInterface(astNode: AstInterface) {
    if (!astNode.entries)
      return
    for (const entry of astNode.entries) {
      if (entry.whichEntry === "indexSignature")
        this.scanIndexSignature(entry)
      else if (entry.whichEntry === "mappedIndexSignature")
        this.scanMappedIndexSignature(entry)
      else if (entry.whichEntry === "property")
        this.scanProperty(entry)
      else if (entry.whichEntry === "functionProperty")
        this.scanPropertyFromFunctionProperty(entry)
    }
  }

  private scanProperty(entry: AstProperty) {
    this.scan(entry.type)
  }

  private scanPropertyFromFunctionProperty(entry: AstFunctionProperty) {
    if (entry.parameters)
      this.scanFunctionParameters(entry.parameters)
    if (entry.returnType)
      this.scan(entry.returnType)
    if (entry.generic)
      this.scanGenericParameters(entry.generic)
  }

  private scanIndexSignature(entry: AstIndexSignature) {
    this.scan(entry.type)
  }

  private scanMappedIndexSignature(entry: AstMappedIndexSignature) {
    this.scan(entry.keyInType)
    this.scan(entry.type)
  }
}