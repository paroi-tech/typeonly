import type {
  AstArrayType,
  AstCompositeType,
  AstDeclaration,
  AstFunctionParameter,
  AstFunctionProperty,
  AstFunctionType,
  AstGenericInstance,
  AstGenericParameter,
  AstIndexSignature,
  AstInlineImportType,
  AstInterface,
  AstKeyofType,
  AstLiteralType,
  AstMappedIndexSignature,
  AstMemberType,
  AstNamedInterface,
  AstNamedType,
  AstProperty,
  AstTupleType,
  AstType,
  TypeOnlyAst,
} from "../ast.d.ts";
import { assertExists } from "../helpers/js-lib.js";
import type {
  RtoArrayType,
  RtoBaseNamedType,
  RtoCompositeType,
  RtoFunctionParameter,
  RtoFunctionType,
  RtoGenericInstance,
  RtoGenericParameter,
  RtoImportedTypeRef,
  RtoIndexSignature,
  RtoInterface,
  RtoKeyofType,
  RtoLiteralType,
  RtoLocalTypeRef,
  RtoMappedIndexSignature,
  RtoMemberType,
  RtoModule,
  RtoNamedType,
  RtoProperty,
  RtoTupleType,
  RtoType,
  RtoTypeName,
} from "../rto.d.ts";
import AstImportTool, { type ImportRef } from "./AstImportTool.js";
import InlineImportScanner from "./InlineImportScanner.js";
import type { RtoModuleLoader } from "./internal-types.js";

const tsTypeNames = new Set(["any", "unknown", "object", "void", "never"]);
const primitiveTypeNames = new Set([
  "string",
  "number",
  "bigint",
  "boolean",
  "symbol",
  "undefined",
  "null",
]);
const defaultGlobals = new Set(["String", "Number", "Bigint", "Boolean", "Symbol", "Date"]);

export interface RtoModuleFactoryOptions {
  defineGlobals?: (globals: Set<string>) => Set<string>;
}

export default class RtoModuleFactory {
  private rtoTypeCreators: {
    [K in Exclude<AstType, string>["whichType"]]: (astNode: any) => RtoType;
  } = {
    array: (astNode) => this.createRtoArrayType(astNode),
    literal: (astNode) => this.createRtoLiteralType(astNode),
    composite: (astNode) => this.createRtoCompositeType(astNode),
    genericInstance: (astNode) => this.createRtoGenericInstance(astNode),
    keyof: (astNode) => this.createRtoKeyofType(astNode),
    member: (astNode) => this.createRtoMemberType(astNode),
    tuple: (astNode) => this.createRtoTupleType(astNode),
    function: (astNode) => this.createRtoFunctionType(astNode),
    inlineImport: (astNode) => this.createRtoImportedRefFromInline(astNode),
    interface: (astNode) => this.createRtoInterface(astNode),
  };
  private globals: Set<string>;
  private namedTypeList: RtoBaseNamedType[] = [];
  private namedTypes = new Map<string, RtoBaseNamedType>();
  private importTool?: AstImportTool;

  constructor(
    private ast: TypeOnlyAst,
    private modulePath?: string,
    options: RtoModuleFactoryOptions = {},
  ) {
    this.globals = new Set(
      options.defineGlobals ? options.defineGlobals(defaultGlobals) : defaultGlobals,
    );
    if (ast.declarations)
      ast.declarations.forEach((astDecl) => this.registerAstDeclaration(astDecl));
  }

  hasExportedNamedType(name: string): boolean {
    const namedType = this.namedTypes.get(name);
    return !!namedType?.exported;
  }

  getModulePath(): string {
    if (!this.modulePath) throw new Error("Missing module path");
    return this.modulePath;
  }

  async loadImports(moduleLoader: RtoModuleLoader) {
    this.importTool = new AstImportTool(this.getModulePath(), moduleLoader);
    if (this.ast.declarations) {
      const inlineScanner = new InlineImportScanner(this.importTool);
      for (const astDecl of this.ast.declarations) {
        if (astDecl.whichDeclaration === "import") this.importTool.addImport(astDecl);
        else if (astDecl.whichDeclaration === "interface") inlineScanner.scan(astDecl);
        else if (astDecl.whichDeclaration === "type") inlineScanner.scan(astDecl.type);
        else if (astDecl.whichDeclaration !== "comment")
          throw new Error(
            `Invalid whichDeclaration: ${(astDecl as AstDeclaration).whichDeclaration}`,
          );
      }
    }
    await this.importTool.load();
  }

  createRtoModule(): RtoModule {
    if (this.ast.declarations) {
      this.ast.declarations.forEach((astDecl) => {
        if (astDecl.whichDeclaration === "interface" || astDecl.whichDeclaration === "type")
          this.fillRtoNamed(astDecl);
        else if (astDecl.whichDeclaration === "import" && !this.importTool)
          throw new Error("Imports are not loaded");
      });
    }
    const module: RtoModule = {};
    if (this.importTool) {
      Object.assign(module, this.importTool.createRtoImports());
    }
    if (this.namedTypeList.length > 0) module.namedTypes = this.namedTypeList as RtoNamedType[];
    return module;
  }

  private registerAstDeclaration(astNode: AstDeclaration) {
    switch (astNode.whichDeclaration) {
      case "interface":
      case "type":
        const namedType = this.createRtoBaseNamedType(astNode);
        this.namedTypes.set(namedType.name, namedType);
        this.namedTypeList.push(namedType);
        break;
      case "import":
      case "comment":
        break;
      default:
        throw new Error(
          `Invalid whichDeclaration: ${(astNode as AstDeclaration).whichDeclaration}`,
        );
    }
  }

  private createRtoBaseNamedType(astNode: AstNamedInterface | AstNamedType) {
    const result: RtoBaseNamedType = {
      name: astNode.name,
    };
    if (astNode.exported) result.exported = astNode.exported;
    if (astNode.generic) result.generic = this.createRtoGenericParameters(astNode.generic);
    if (astNode.docComment) result.docComment = astNode.docComment;
    return result;
  }

  private fillRtoNamed(astNode: AstNamedInterface | AstNamedType) {
    const base = this.getBaseNamedType(astNode.name);
    const type =
      astNode.whichDeclaration === "interface"
        ? astNode.extends
          ? this.convertExtendsToRtoIntersection(astNode)
          : this.createRtoInterface(astNode)
        : this.createRtoType(astNode.type);
    Object.assign(base, type);
  }

  private convertExtendsToRtoIntersection(astNode: AstNamedInterface): RtoCompositeType {
    assertExists(astNode.extends);
    const typeNames = astNode.extends;
    const types = typeNames.map((child) => this.createRtoType(child));
    types.push(this.createRtoInterface(astNode));
    return {
      kind: "composite",
      op: "intersection",
      types,
    };
  }

  private createRtoType(astNode: AstType): RtoType {
    if (typeof astNode === "string") {
      const kindOfName = this.findKindOfName(astNode);
      if (kindOfName) return createRtoTypeName(kindOfName, astNode);
      if (this.namedTypes.get(astNode)) return createRtoLocalTypeRef(astNode);
      if (this.importTool) {
        const importRef = this.importTool.findImportedMember(astNode);
        if (importRef) return createRtoImportedTypeRef(importRef);
      }
      throw new Error(`Unexpected type: ${astNode}`);
    }
    const creator = this.rtoTypeCreators[astNode.whichType];
    if (!creator) throw new Error(`Unexpected whichType: ${astNode.whichType}`);
    return creator(astNode);
  }

  private createRtoArrayType(astNode: AstArrayType): RtoArrayType {
    return {
      kind: "array",
      itemType: this.createRtoType(astNode.itemType),
    };
  }

  private createRtoLiteralType(astNode: AstLiteralType): RtoLiteralType {
    return {
      kind: "literal",
      literal: astNode.literal,
    };
  }

  private createRtoCompositeType(astNode: AstCompositeType): RtoCompositeType {
    return {
      kind: "composite",
      op: astNode.op,
      types: astNode.types.map((child) => this.createRtoType(child)),
    };
  }

  private createRtoGenericInstance(astNode: AstGenericInstance): RtoGenericInstance {
    return {
      kind: "genericInstance",
      genericName: astNode.genericName,
      parameterTypes: astNode.parameterTypes.map((child) => this.createRtoType(child)),
    };
  }

  private createRtoKeyofType(astNode: AstKeyofType): RtoKeyofType {
    return {
      kind: "keyof",
      type: this.createRtoType(astNode.type),
    };
  }

  private createRtoMemberType(astNode: AstMemberType): RtoMemberType {
    return {
      kind: "member",
      parentType: this.createRtoType(astNode.parentType),
      memberName:
        typeof astNode.memberName === "string"
          ? astNode.memberName
          : {
              literal: astNode.memberName.literal,
            },
    };
  }

  private createRtoTupleType(astNode: AstTupleType): RtoTupleType {
    const type: RtoTupleType = {
      kind: "tuple",
    };
    if (astNode.itemTypes)
      type.itemTypes = astNode.itemTypes.map((child) => this.createRtoType(child));
    return type;
  }

  private createRtoFunctionType(astNode: AstFunctionType): RtoFunctionType {
    const type: RtoFunctionType = {
      kind: "function",
      returnType: this.createRtoType(astNode.returnType),
    };
    if (astNode.parameters) type.parameters = this.createRtoFunctionParameters(astNode.parameters);
    if (astNode.generic) type.generic = this.createRtoGenericParameters(astNode.generic);
    return type;
  }

  private createRtoFunctionParameters(astNodes: AstFunctionParameter[]): RtoFunctionParameter[] {
    return astNodes.map(({ name, type, optional }) => {
      const param: RtoFunctionParameter = { name };
      if (type) param.type = this.createRtoType(type);
      if (optional) param.optional = optional;
      return param;
    });
  }

  private createRtoGenericParameters(astNodes: AstGenericParameter[]): RtoGenericParameter[] {
    return astNodes.map(({ name, extendsType, defaultType }) => {
      const param: RtoGenericParameter = { name };
      if (extendsType) param.extendsType = this.createRtoType(extendsType);
      if (defaultType) param.defaultType = this.createRtoType(defaultType);
      return param;
    });
  }

  private createRtoImportedRefFromInline(astNode: AstInlineImportType): RtoImportedTypeRef {
    if (!this.importTool) throw new Error("Imports are not loaded");
    return createRtoImportedTypeRef(this.importTool.inlineImport(astNode));
  }

  private createRtoInterface(astNode: AstInterface): RtoInterface {
    const result: RtoInterface = {
      kind: "interface",
    };
    if (astNode.entries) {
      for (const entry of astNode.entries) {
        if (entry.whichEntry === "indexSignature") {
          result.indexSignature = this.createRtoIndexSignature(entry);
        } else if (entry.whichEntry === "mappedIndexSignature") {
          result.mappedIndexSignature = this.createRtoMappedIndexSignature(entry);
        } else if (entry.whichEntry === "property") {
          if (!result.properties) result.properties = [];
          result.properties.push(this.createRtoProperty(entry));
        } else if (entry.whichEntry === "functionProperty") {
          if (!result.properties) result.properties = [];
          result.properties.push(this.createRtoPropertyFromFunctionProperty(entry));
        }
      }
    }
    return result;
  }

  private createRtoProperty(entry: AstProperty): RtoProperty {
    const property: RtoProperty = {
      name: entry.name,
      type: this.createRtoType(entry.type),
    };
    if (entry.optional) property.optional = entry.optional;
    if (entry.readonly) property.readonly = entry.readonly;
    if (entry.docComment) property.docComment = entry.docComment;
    return property;
  }

  private createRtoPropertyFromFunctionProperty(entry: AstFunctionProperty): RtoProperty {
    const type: RtoFunctionType = {
      kind: "function",
      returnType: this.createRtoType(entry.returnType || "any"),
    };
    if (entry.parameters) type.parameters = this.createRtoFunctionParameters(entry.parameters);
    if (entry.generic) type.generic = this.createRtoGenericParameters(entry.generic);
    const property: RtoProperty = {
      name: entry.name,
      type,
    };
    if (entry.optional) property.optional = entry.optional;
    if (entry.readonly) property.readonly = entry.readonly;
    if (entry.docComment) property.docComment = entry.docComment;
    return property;
  }

  private createRtoIndexSignature(entry: AstIndexSignature): RtoIndexSignature {
    const indexSignature: RtoIndexSignature = {
      keyName: entry.keyName,
      keyType: entry.keyType,
      type: this.createRtoType(entry.type),
    };
    if (entry.optional) indexSignature.optional = entry.optional;
    if (entry.readonly) indexSignature.readonly = entry.readonly;
    if (entry.docComment) indexSignature.docComment = entry.docComment;
    return indexSignature;
  }

  private createRtoMappedIndexSignature(entry: AstMappedIndexSignature): RtoMappedIndexSignature {
    const mappedIndexSignature: RtoMappedIndexSignature = {
      keyName: entry.keyName,
      keyInType: this.createRtoType(entry.keyInType),
      type: this.createRtoType(entry.type),
    };
    if (entry.optional) mappedIndexSignature.optional = entry.optional;
    if (entry.readonly) mappedIndexSignature.readonly = entry.readonly;
    if (entry.docComment) mappedIndexSignature.docComment = entry.docComment;
    return mappedIndexSignature;
  }

  private getBaseNamedType(name: string): RtoBaseNamedType {
    const result = this.namedTypes.get(name);
    if (!result) throw new Error(`Unknown named type: ${name}`);
    return result;
  }

  private findKindOfName(typeName: string): "ts" | "primitive" | "global" | undefined {
    if (tsTypeNames.has(typeName)) return "ts";
    if (primitiveTypeNames.has(typeName)) return "primitive";
    if (this.globals.has(typeName)) return "global";
  }
}

function createRtoTypeName(group: "ts" | "primitive" | "global", refName: string): RtoTypeName {
  return {
    kind: "name",
    group,
    refName,
  };
}

function createRtoLocalTypeRef(refName: string): RtoLocalTypeRef {
  return {
    kind: "localRef",
    refName,
  };
}

function createRtoImportedTypeRef(ref: ImportRef): RtoImportedTypeRef {
  return {
    kind: "importedRef",
    ...ref,
  };
}
