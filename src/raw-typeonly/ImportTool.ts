import Project from "./Project"
import { AstImport, AstInlineImportType } from "../ast";
import { RtoImportedTypeRef } from "../rto";

export interface ImportRef {
  refName: string
  namespace?: string
}

export default class ImportTool {
  constructor(private project: Project, public path?: string) {
  }

  addImport(astNode: AstImport) {
    if (astNode.whichImport === "namespaced") {
      astNode.asNamespace
    } else {
      astNode.defaultName
      astNode.namedMembers
    }
  }

  findImport(fullName: string): ImportRef | undefined {
    return undefined as any // TODO
  }

  inlineImport(astNode: AstInlineImportType): ImportRef {
    return undefined as any // TODO
  }
}