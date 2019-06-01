import ModuleFactory from "./ModuleFactory"

export type GetModuleFactory = (modulePath: ModulePath) => ModuleFactory

export interface ModulePath {
  from: string
  relativeToModule?: string
}

export default class Project {

}