import type { RelativeModulePath } from "../helpers/module-path-helpers.js";
import type RtoModuleFactory from "./RtoModuleFactory.d.ts";

export type RtoModuleLoader = (modulePath: RelativeModulePath) => Promise<RtoModuleFactory>;
