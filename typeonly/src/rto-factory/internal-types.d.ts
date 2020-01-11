import RtoModuleFactory from "./RtoModuleFactory";
import { RelativeModulePath } from "../helpers/module-path-helpers";

export type RtoModuleLoader = (modulePath: RelativeModulePath) => Promise<RtoModuleFactory>
