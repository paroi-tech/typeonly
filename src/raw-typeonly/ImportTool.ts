import { AstImport, AstInlineImportType } from "../ast"
import { RtoImport, RtoNamespacedImport } from "../rto"
import { ModuleLoader } from "./Project"
import RtoModuleFactory from "./RtoModuleFactory"

export interface ImportRef {
  refName: string
  namespace?: string
}

interface ImportedFromModule {
  namedMembers: Array<{ name: string, as?: string }>
  namespaces: string[]
  inlineMembers: Set<string>
}

export default class ImportTool {
  private fromModules = new Map<string, ImportedFromModule>()
  private importedIdentifiers = new Set<string>()
  private importedNamespaces = new Set<string>()

  constructor(readonly path: string, private moduleLoader: ModuleLoader) {
  }

  addImport(astNode: AstImport) {
    const ifm = this.getImportedFromModule(astNode.from)
    if (astNode.whichImport === "namespaced")
      this.addNamespacedImport(astNode.asNamespace, ifm)
    else {
      if (astNode.namedMembers) {
        for (const member of astNode.namedMembers)
          this.addNamedImport({ ...member }, ifm)
      }
    }
  }

  addInlineImport(astNode: AstInlineImportType) {
    const ifm = this.getImportedFromModule(astNode.from)
    ifm.inlineMembers.add(astNode.exportedName)
  }

  async load() {
    for (const [from, ifm] of this.fromModules.entries()) {
      const factory = await this.moduleLoader({ from, relativeToModule: this.path })
      this.checkExportedNames(ifm, factory)
    }
  }

  createRtoImports(): { imports?: RtoImport[], namespacedImports?: RtoNamespacedImport[] } {
    const imports: RtoImport[] = []
    const namespacedImports: RtoNamespacedImport[] = []
    for (const [from, ifm] of this.fromModules.entries()) {
      const { namedMembers, namespaces } = ifm
      if (namedMembers.length > 0) {
        imports.push({
          from,
          namedMembers
        })
      }
      namespaces.forEach(asNamespace => namespacedImports.push({ from, asNamespace }))
    }
    const result: { imports?: RtoImport[], namespacedImports?: RtoNamespacedImport[] } = {}
    if (imports.length > 0)
      result.imports = imports
    if (namespacedImports.length > 0)
      result.namespacedImports = namespacedImports
    return result
  }

  findImportedMember(fullName: string): ImportRef | undefined {
    const dotIndex = fullName.indexOf(".")
    if (dotIndex !== -1) {
      const refName = fullName.slice(0, dotIndex)
      const namespace = fullName.slice(dotIndex + 1)
      if (!this.importedNamespaces.has(namespace))
        throw new Error(`Unknown namespace: ${namespace}`)
      return { refName, namespace }
    }
    return this.importedIdentifiers.has(fullName) ? { refName: fullName } : undefined
  }

  inlineImport({ exportedName }: AstInlineImportType): ImportRef {
    return { refName: exportedName }
  }

  private addNamespacedImport(asNamespace: string, ifm: ImportedFromModule) {
    if (this.importedNamespaces.has(asNamespace) || this.importedIdentifiers.has(asNamespace))
      throw new Error(`Duplicate identifier '${asNamespace}'`)
    this.importedNamespaces.add(asNamespace)
    ifm.namespaces.push(asNamespace)
  }

  private addNamedImport(member: { name: string, as?: string }, ifm: ImportedFromModule) {
    const name = member.as || member.name
    if (this.importedNamespaces.has(name) || this.importedIdentifiers.has(name))
      throw new Error(`Duplicate identifier '${name}'`)
    this.importedIdentifiers.add(name)
    ifm.namedMembers.push({ ...member })
  }

  private getImportedFromModule(from: string): ImportedFromModule {
    let ifm = this.fromModules.get(from)
    if (!ifm) {
      ifm = {
        namedMembers: [],
        namespaces: [],
        inlineMembers: new Set(),
      }
      this.fromModules.set(from, ifm)
    }
    return ifm
  }

  private checkExportedNames(ifm: ImportedFromModule, factory: RtoModuleFactory) {
    for (const { name } of ifm.namedMembers) {
      if (!factory.hasExportedNamedType(name))
        throw new Error(`Module '${factory.getModulePath()}' has no exported member '${name}'.`)
    }
    for (const name of ifm.inlineMembers) {
      if (!factory.hasExportedNamedType(name))
        throw new Error(`Module '${factory.getModulePath()}' has no exported member '${name}'.`)
    }
  }
}