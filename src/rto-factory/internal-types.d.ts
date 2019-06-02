import RtoModuleFactory from "./RtoModuleFactory";

export type RtoModuleLoader = (modulePath: RelativeModulePath) => Promise<RtoModuleFactory>

export interface RelativeModulePath {
  from: string
  relativeToModule?: string
}
