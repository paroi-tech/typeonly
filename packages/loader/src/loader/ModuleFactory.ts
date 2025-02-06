import type {
  RtoArrayType,
  RtoCompositeType,
  RtoFunctionParameter,
  RtoFunctionType,
  RtoGenericInstance,
  RtoGenericParameter,
  RtoGenericParameterName,
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
} from "typeonly";
import type {
  ArrayType,
  BaseNamedType,
  CompositeType,
  FunctionParameter,
  FunctionType,
  GenericInstance,
  GenericParameter,
  GenericParameterName,
  Import,
  ImportNamedMembers,
  ImportedTypeRef,
  IndexSignature,
  Interface,
  KeyofType,
  LiteralType,
  LocalTypeRef,
  MappedIndexSignature,
  MemberType,
  Module,
  NamedType,
  NamespacedImport,
  Property,
  TupleType,
  Type,
  TypeName,
} from "../typeonly-loader.d.ts";
import type { GetModuleFactory } from "./Project.js";

export default class ModuleFactory {
  readonly module: Module = {
    namedTypes: {},
  };

  private typeCreators: {
    [K in RtoType["kind"]]: (rtoNode: any, obj: object) => Type;
  } = {
    name: (rtoNode, obj) => this.createTypeName(rtoNode, obj),
    localRef: (rtoNode, obj) => this.createLocalRefType(rtoNode, obj),
    importedRef: (rtoNode, obj) => this.createImportedRefType(rtoNode, obj),
    genericParameterName: (rtoNode, obj) => this.createGenericParameterName(rtoNode, obj),
    array: (rtoNode, obj) => this.createArrayType(rtoNode, obj),
    literal: (rtoNode, obj) => this.createLiteralType(rtoNode, obj),
    composite: (rtoNode, obj) => this.createCompositeType(rtoNode, obj),
    genericInstance: (rtoNode, obj) => this.createGenericInstance(rtoNode, obj),
    keyof: (rtoNode, obj) => this.createKeyofType(rtoNode, obj),
    member: (rtoNode, obj) => this.createMemberType(rtoNode, obj),
    tuple: (rtoNode, obj) => this.createTupleType(rtoNode, obj),
    function: (rtoNode, obj) => this.createFunctionType(rtoNode, obj),
    interface: (rtoNode, obj) => this.createInterface(rtoNode, obj),
  };
  private namedTypes = new Map<string, BaseNamedType>();
  private importedNamedMembers = new Map<string, NamedType>();
  private importedNamespaces = new Map<string, ModuleFactory>();
  private gmf?: GetModuleFactory;

  constructor(
    readonly rtoModule: RtoModule,
    modulePath?: string,
  ) {
    this.module.path = modulePath;
    if (rtoModule.namedTypes) {
      rtoModule.namedTypes.forEach((rtoNode) => {
        const namedType = this.createBaseNamedType(rtoNode);
        this.namedTypes.set(namedType.name, namedType);
      });
    }
  }

  getExportedNamedType(name: string): BaseNamedType {
    const namedType = this.namedTypes.get(name);
    if (!namedType || !namedType.exported)
      throw new Error(`Module '${this.module.path}' has no exported member '${name}'`);
    return namedType;
  }

  createModule(moduleFactoryOf: GetModuleFactory): Module {
    this.gmf = moduleFactoryOf;
    Object.assign(this.module, this.createImports());
    if (this.rtoModule.namedTypes) {
      for (const rtoNode of this.rtoModule.namedTypes) {
        const namedType = this.fillNamedType(rtoNode);
        this.module.namedTypes[namedType.name] = namedType;
      }
    }
    return this.module;
  }

  private createImports(): { imports?: Import[]; namespacedImports?: NamespacedImport[] } {
    const result: { imports?: Import[]; namespacedImports?: NamespacedImport[] } = {};
    if (this.rtoModule.namespacedImports) {
      result.namespacedImports = [];
      for (const { from, asNamespace } of this.rtoModule.namespacedImports) {
        result.namespacedImports.push({
          from: this.moduleFactoryOf(from).module,
          asNamespace,
        });
        this.importedNamespaces.set(asNamespace, this.moduleFactoryOf(from));
      }
    }
    if (this.rtoModule.imports) {
      result.imports = [];
      for (const rtoNode of this.rtoModule.imports) {
        const factory = this.moduleFactoryOf(rtoNode.from);
        const namedMembers: ImportNamedMembers = {};
        for (const rtoMember of rtoNode.namedMembers || []) {
          const name = rtoMember.as || rtoMember.name;
          const imported = factory.getExportedNamedType(rtoMember.name) as NamedType;
          namedMembers[name] = imported;
          this.importedNamedMembers.set(name, imported);
        }
        result.imports.push({
          from: factory.module,
          namedMembers,
        });
      }
    }
    return result;
  }

  private createBaseNamedType(rtoNode: RtoNamedType) {
    const result: BaseNamedType = {
      module: this.module,
      name: rtoNode.name,
      exported: !!rtoNode.exported,
    };
    if (rtoNode.generic) result.generic = this.createGenericParameters(rtoNode.generic);
    if (rtoNode.docComment) result.docComment = rtoNode.docComment;
    return result;
  }

  private fillNamedType(rtoNode: RtoNamedType): NamedType {
    const base = this.getBaseNamedType(rtoNode.name);
    this.createType(rtoNode, base);
    return base as NamedType;
  }

  private createType(rtoNode: RtoType, obj: object = {}): Type {
    const creator = this.typeCreators[rtoNode.kind];
    if (!creator) throw new Error(`Unexpected kind: ${rtoNode.kind}`);
    return creator(rtoNode, obj);
  }

  private createTypeName(rtoNode: RtoTypeName, obj: object): TypeName {
    return Object.assign(obj, rtoNode);
  }

  private createLocalRefType(rtoNode: RtoLocalTypeRef, obj: object): LocalTypeRef {
    return Object.assign(obj, rtoNode, {
      ref: this.getBaseNamedType(rtoNode.refName) as NamedType,
    });
  }

  private createImportedRefType(rtoNode: RtoImportedTypeRef, obj: object): ImportedTypeRef {
    let ref: NamedType;
    if (rtoNode.namespace) {
      const factory = this.importedNamespaces.get(rtoNode.namespace);
      if (!factory) throw new Error(`Unknown namespace: ${rtoNode.namespace}`);
      ref = factory.getExportedNamedType(rtoNode.refName) as NamedType;
    } else {
      const namedType = this.importedNamedMembers.get(rtoNode.refName);
      if (!namedType) throw new Error(`Unknown imported member: ${rtoNode.refName}`);
      ref = namedType;
    }
    return Object.assign(obj, rtoNode, { ref });
  }

  private createGenericParameterName(
    rtoNode: RtoGenericParameterName,
    obj: object,
  ): GenericParameterName {
    return Object.assign(obj, rtoNode);
  }

  private createArrayType(rtoNode: RtoArrayType, obj: object): ArrayType {
    return Object.assign(obj, {
      kind: "array",
      itemType: this.createType(rtoNode.itemType),
    } as const);
  }

  private createLiteralType(rtoNode: RtoLiteralType, obj: object): LiteralType {
    return Object.assign(obj, rtoNode);
  }

  private createCompositeType(rtoNode: RtoCompositeType, obj: object): CompositeType {
    return Object.assign(obj, {
      kind: "composite",
      op: rtoNode.op,
      types: rtoNode.types.map((child) => this.createType(child)),
    } as const);
  }

  private createGenericInstance(rtoNode: RtoGenericInstance, obj: object): GenericInstance {
    return Object.assign(obj, {
      kind: "genericInstance",
      genericName: rtoNode.genericName,
      parameterTypes: rtoNode.parameterTypes.map((child) => this.createType(child)),
    } as const);
  }

  private createKeyofType(rtoNode: RtoKeyofType, obj: object): KeyofType {
    return Object.assign(obj, {
      kind: "keyof",
      type: this.createType(rtoNode.type),
    } as const);
  }

  private createMemberType(rtoNode: RtoMemberType, obj: object): MemberType {
    return Object.assign(obj, {
      kind: "member",
      parentType: this.createType(rtoNode.parentType),
      memberName: rtoNode.memberName,
    } as const);
  }

  private createTupleType(rtoNode: RtoTupleType, obj: object): TupleType {
    return Object.assign(obj, {
      kind: "tuple",
      itemTypes: rtoNode.itemTypes ? rtoNode.itemTypes.map((child) => this.createType(child)) : [],
    } as const);
  }

  private createFunctionType(rtoNode: RtoFunctionType, obj: object): FunctionType {
    const type: FunctionType = Object.assign(obj, {
      kind: "function",
      parameters: rtoNode.parameters ? this.createFunctionParameters(rtoNode.parameters) : [],
      returnType: this.createType(rtoNode.returnType),
    } as const);
    if (rtoNode.generic) type.generic = this.createGenericParameters(rtoNode.generic);
    return type;
  }

  private createFunctionParameters(rtoNodes: RtoFunctionParameter[]): FunctionParameter[] {
    return rtoNodes.map(({ name, type, optional }) => {
      return {
        name,
        type: type ? this.createType(type) : makeAny(),
        optional: !!optional,
      };
    });
  }

  private createGenericParameters(rtoNodes: RtoGenericParameter[]): GenericParameter[] {
    return rtoNodes.map(({ name, extendsType, defaultType }) => {
      const param: GenericParameter = { name };
      if (extendsType) param.extendsType = this.createType(extendsType);
      if (defaultType) param.defaultType = this.createType(defaultType);
      return param;
    });
  }

  private createInterface(rtoNode: RtoInterface, obj: object): Interface {
    const result: Interface = Object.assign(obj, {
      kind: "interface",
    } as const);
    if (rtoNode.properties) {
      result.properties = {};
      for (const rtoProp of rtoNode.properties) {
        const property = this.createProperty(rtoProp, result);
        result.properties[property.name] = property;
      }
    }
    if (rtoNode.indexSignature)
      result.indexSignature = this.createIndexSignature(rtoNode.indexSignature, result);
    if (rtoNode.mappedIndexSignature)
      result.mappedIndexSignature = this.createMappedIndexSignature(
        rtoNode.mappedIndexSignature,
        result,
      );
    return result;
  }

  private createProperty(entry: RtoProperty, of: Interface): Property {
    const property: Property = {
      of,
      name: entry.name,
      type: this.createType(entry.type),
      optional: !!entry.optional,
      readonly: !!entry.readonly,
    };
    if (entry.docComment) property.docComment = entry.docComment;
    return property;
  }

  private createIndexSignature(entry: RtoIndexSignature, of: Interface): IndexSignature {
    const indexSignature: IndexSignature = {
      of,
      keyName: entry.keyName,
      keyType: entry.keyType,
      type: this.createType(entry.type),
      optional: !!entry.optional,
      readonly: !!entry.readonly,
    };
    if (entry.docComment) indexSignature.docComment = entry.docComment;
    return indexSignature;
  }

  private createMappedIndexSignature(
    entry: RtoMappedIndexSignature,
    of: Interface,
  ): MappedIndexSignature {
    const mappedIndexSignature: MappedIndexSignature = {
      of,
      keyName: entry.keyName,
      keyInType: this.createType(entry.keyInType),
      type: this.createType(entry.type),
      optional: !!entry.optional,
      readonly: !!entry.readonly,
    };
    if (entry.docComment) mappedIndexSignature.docComment = entry.docComment;
    return mappedIndexSignature;
  }

  private getBaseNamedType(name: string): BaseNamedType {
    const result = this.namedTypes.get(name);
    if (!result) throw new Error(`Unknown named type: ${name}`);
    return result;
  }

  private moduleFactoryOf(from: string) {
    if (!this.gmf) throw new Error("Cannot get a module here");
    if (!this.module.path) throw new Error("Cannot import from an embedded module");
    return this.gmf({
      from,
      relativeToModule: this.module.path,
    });
  }
}

function makeAny(): TypeName {
  return { kind: "name", group: "ts", refName: "any" };
}
