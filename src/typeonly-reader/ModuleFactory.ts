import { RtoArrayType, RtoCompositeType, RtoFunctionParameter, RtoFunctionType, RtoGenericInstance, RtoGenericParameter, RtoGenericParameterName, RtoImportedTypeRef, RtoIndexSignature, RtoInterface, RtoKeyofType, RtoLiteralType, RtoLocalTypeRef, RtoMappedIndexSignature, RtoMemberType, RtoModule, RtoNamedType, RtoProperty, RtoTupleType, RtoType, RtoTypeName } from "../rto"
import { ArrayType, BaseNamedType, CompositeType, FunctionParameter, FunctionType, GenericInstance, GenericParameter, GenericParameterName, Import, ImportedTypeRef, ImportNamedMembers, IndexSignature, Interface, KeyofType, LiteralType, LocalTypeRef, MappedIndexSignature, MemberType, Module, NamedType, NamespacedImport, Property, TupleType, Type, TypeName } from "../typeonly-reader"
import { GetModuleFactory } from "./Project"

export default class ModuleFactory {
  readonly module: Module = {
    namedTypes: {}
  }

  private typeCreators: {
    [K in RtoType["kind"]]: (rtoNode: any) => Type
  } = {
      name: rtoNode => this.createTypeName(rtoNode),
      localRef: rtoNode => this.createLocalRefType(rtoNode),
      importedRef: rtoNode => this.createImportedRefType(rtoNode),
      genericParameterName: rtoNode => this.createGenericParameterName(rtoNode),
      array: rtoNode => this.createArrayType(rtoNode),
      literal: rtoNode => this.createLiteralType(rtoNode),
      composite: rtoNode => this.createCompositeType(rtoNode),
      genericInstance: rtoNode => this.createGenericInstance(rtoNode),
      keyof: rtoNode => this.createKeyofType(rtoNode),
      member: rtoNode => this.createMemberType(rtoNode),
      tuple: rtoNode => this.createTupleType(rtoNode),
      function: rtoNode => this.createFunctionType(rtoNode),
      interface: rtoNode => this.createInterface(rtoNode),
    }
  private namedTypes = new Map<string, BaseNamedType>()
  private importedNamedMembers = new Map<string, NamedType>()
  private importedNamespaces = new Map<string, ModuleFactory>()
  private gmf?: GetModuleFactory

  constructor(private rtoModule: RtoModule) {
    if (rtoModule.path)
      this.module.path = rtoModule.path
    if (rtoModule.namedTypes) {
      rtoModule.namedTypes.forEach(rtoNode => {
        const namedType = this.createBaseNamedType(rtoNode)
        this.namedTypes.set(namedType.name, namedType)
      })
    }
  }

  getExportedNamedType(name: string): BaseNamedType {
    const namedType = this.namedTypes.get(name)
    if (!namedType || !namedType.exported)
      throw new Error(`Module '${this.rtoModule.path}' has no exported member '${name}'`)
    return namedType
  }

  createModule(moduleFactoryOf: GetModuleFactory): Module {
    this.gmf = moduleFactoryOf
    Object.assign(this.module, this.createImports())
    if (this.rtoModule.namedTypes) {
      for (const rtoNode of this.rtoModule.namedTypes) {
        const namedType = this.fillNamedType(rtoNode)
        this.module.namedTypes[namedType.name] = namedType
      }
    }
    return this.module
  }

  private createImports(): { imports?: Import[], namespacedImports?: NamespacedImport[] } {
    const result: { imports?: Import[], namespacedImports?: NamespacedImport[] } = {}
    if (this.rtoModule.namespacedImports) {
      result.namespacedImports = []
      for (const { from, asNamespace } of this.rtoModule.namespacedImports) {
        result.namespacedImports.push({
          from: this.moduleFactoryOf(from).module,
          asNamespace
        })
        this.importedNamespaces.set(asNamespace, this.moduleFactoryOf(from))
      }
    }
    if (this.rtoModule.imports) {
      result.imports = []
      for (const rtoNode of this.rtoModule.imports) {
        const factory = this.moduleFactoryOf(rtoNode.from)
        const namedMembers: ImportNamedMembers = {}
        for (const rtoMember of rtoNode.namedMembers || []) {
          const name = rtoMember.as || rtoMember.name
          const imported = factory.getExportedNamedType(rtoMember.name) as NamedType
          namedMembers[name] = imported
          this.importedNamedMembers.set(name, imported)
        }
        result.imports.push({
          from: factory.module,
          namedMembers
        })
      }
    }
    return result
  }

  private createBaseNamedType(rtoNode: RtoNamedType) {
    const result: BaseNamedType = {
      module: this.module,
      name: rtoNode.name,
      exported: !!rtoNode.exported
    }
    if (rtoNode.generic)
      result.generic = this.createGenericParameters(rtoNode.generic)
    if (rtoNode.docComment)
      result.docComment = rtoNode.docComment
    return result
  }

  private fillNamedType(rtoNode: RtoNamedType): NamedType {
    const base = this.getBaseNamedType(rtoNode.name)
    const type = this.createType(rtoNode)
    Object.assign(base, type)
    return base as NamedType
  }

  private createType(rtoNode: RtoType): Type {
    const creator = this.typeCreators[rtoNode.kind]
    if (!creator)
      throw new Error(`Unexpected kind: ${rtoNode.kind}`)
    return creator(rtoNode)
  }

  private createTypeName(rtoNode: RtoTypeName): TypeName {
    return { ...rtoNode }
  }

  private createLocalRefType(rtoNode: RtoLocalTypeRef): LocalTypeRef {
    return {
      ...rtoNode,
      ref: this.getBaseNamedType(rtoNode.refName) as NamedType
    }
  }

  private createImportedRefType(rtoNode: RtoImportedTypeRef): ImportedTypeRef {
    let ref: NamedType
    if (rtoNode.namespace) {
      const factory = this.importedNamespaces.get(rtoNode.namespace)
      if (!factory)
        throw new Error(`Unknown namespace: ${rtoNode.namespace}`)
      ref = factory.getExportedNamedType(rtoNode.refName) as NamedType
    } else {
      const namedType = this.importedNamedMembers.get(rtoNode.refName)
      if (!namedType)
        throw new Error(`Unknown imported member: ${rtoNode.refName}`)
      ref = namedType
    }
    return {
      ...rtoNode,
      ref
    }
  }

  private createGenericParameterName(rtoNode: RtoGenericParameterName): GenericParameterName {
    return { ...rtoNode }
  }

  private createArrayType(rtoNode: RtoArrayType): ArrayType {
    return {
      kind: "array",
      itemType: this.createType(rtoNode.itemType)
    }
  }

  private createLiteralType(rtoNode: RtoLiteralType): LiteralType {
    return { ...rtoNode }
  }

  private createCompositeType(rtoNode: RtoCompositeType): CompositeType {
    return {
      kind: "composite",
      op: rtoNode.op,
      types: rtoNode.types.map(child => this.createType(child))
    }
  }

  private createGenericInstance(rtoNode: RtoGenericInstance): GenericInstance {
    return {
      kind: "genericInstance",
      genericName: rtoNode.genericName,
      parameterTypes: rtoNode.parameterTypes.map(child => this.createType(child))
    }
  }

  private createKeyofType(rtoNode: RtoKeyofType): KeyofType {
    return {
      kind: "keyof",
      type: this.createType(rtoNode.type)
    }
  }

  private createMemberType(rtoNode: RtoMemberType): MemberType {
    return {
      kind: "member",
      parentType: this.createType(rtoNode.parentType),
      memberName: rtoNode.memberName
    }
  }

  private createTupleType(rtoNode: RtoTupleType): TupleType {
    return {
      kind: "tuple",
      itemTypes: rtoNode.itemTypes ? rtoNode.itemTypes.map(child => this.createType(child)) : []
    }
  }

  private createFunctionType(rtoNode: RtoFunctionType): FunctionType {
    const type: FunctionType = {
      kind: "function",
      parameters: rtoNode.parameters ? this.createFunctionParameters(rtoNode.parameters) : [],
      returnType: this.createType(rtoNode.returnType),
    }
    if (rtoNode.generic)
      type.generic = this.createGenericParameters(rtoNode.generic)
    return type
  }

  private createFunctionParameters(rtoNodes: RtoFunctionParameter[]): FunctionParameter[] {
    return rtoNodes.map(({ name, type }) => {
      return {
        name,
        type: type ? this.createType(type) : makeAny()
      }
    })
  }

  private createGenericParameters(rtoNodes: RtoGenericParameter[]): GenericParameter[] {
    return rtoNodes.map(({ name, extendsType, defaultType }) => {
      const param: GenericParameter = { name }
      if (extendsType)
        param.extendsType = this.createType(extendsType)
      if (defaultType)
        param.defaultType = this.createType(defaultType)
      return param
    })
  }

  private createInterface(rtoNode: RtoInterface): Interface {
    const result: Interface = {
      kind: "interface"
    } as any // TODO
    // if (rtoNode.entries) {
    //   for (const entry of rtoNode.entries) {
    //     if (entry.whichEntry === "indexSignature") {
    //       // if (result.indexSignature || result.mappedIndexSignature)
    //       //   throw new Error(`An interface cannot have several index signatures`)
    //       result.indexSignature = this.createIndexSignature(entry)
    //     } else if (entry.whichEntry === "mappedIndexSignature") {
    //       // if (result.indexSignature || result.mappedIndexSignature || result.properties)
    //       //   throw new Error(`An interface cannot have other entries with a mapped index signature`)
    //       result.mappedIndexSignature = this.createMappedIndexSignature(entry)
    //     } else if (entry.whichEntry === "property") {
    //       // if (result.mappedIndexSignature)
    //       //   throw new Error(`An interface cannot have other entries with a mapped index signature`)
    //       if (!result.properties)
    //         result.properties = []
    //       result.properties.push(this.createProperty(entry))
    //     } else if (entry.whichEntry === "functionProperty") {
    //       // if (result.mappedIndexSignature)
    //       //   throw new Error(`An interface cannot have other entries with a mapped index signature`)
    //       if (!result.properties)
    //         result.properties = []
    //       result.properties.push(this.createPropertyFromFunctionProperty(entry))
    //     }
    //   }
    // }
    return result
  }

  private createProperty(entry: RtoProperty): Property {
    const property: Property = {
      name: entry.name,
      type: this.createType(entry.type),
      optional: !!entry.optional,
      readonly: !!entry.readonly,
    }
    if (entry.docComment)
      property.docComment = entry.docComment
    return property
  }

  private createIndexSignature(entry: RtoIndexSignature): IndexSignature {
    const indexSignature: IndexSignature = {
      keyName: entry.keyName,
      keyType: entry.keyType,
      type: this.createType(entry.type),
      optional: !!entry.optional,
      readonly: !!entry.readonly,
    }
    if (entry.docComment)
      indexSignature.docComment = entry.docComment
    return indexSignature
  }

  private createMappedIndexSignature(entry: RtoMappedIndexSignature): MappedIndexSignature {
    const mappedIndexSignature: MappedIndexSignature = {
      keyName: entry.keyName,
      keyInType: this.createType(entry.keyInType),
      type: this.createType(entry.type),
      optional: !!entry.optional,
      readonly: !!entry.readonly,
    }
    if (entry.docComment)
      mappedIndexSignature.docComment = entry.docComment
    return mappedIndexSignature
  }

  private getBaseNamedType(name: string): BaseNamedType {
    const result = this.namedTypes.get(name)
    if (!result)
      throw new Error(`Unknown named type: ${name}`)
    return result
  }

  private moduleFactoryOf(from: string) {
    if (!this.gmf)
      throw new Error(`Cannot get a module here`)
    return this.gmf({
      from,
      relativeToModule: this.rtoModule.path
    })
  }
}

function makeAny(): TypeName {
  return { kind: "name", group: "ts", refName: "any" }
}