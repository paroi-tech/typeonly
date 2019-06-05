import { readModules, ReadModulesOptions } from "@typeonly/reader"
import Checker from "./Checker"

export async function createChecker(options: ReadModulesOptions) {
  return new Checker(await readModules(options))
}