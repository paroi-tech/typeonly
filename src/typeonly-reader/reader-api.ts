import * as fs from "fs"
import { extname } from "path";
import { promisify } from "util"
import { Modules } from "../typeonly-reader"
import Project from "./Project"

const readdir = promisify(fs.readdir)

export interface ReadModulesOptions {
  baseDir: string
  modulePaths?: string[]
  encoding?: string
}

export async function readModules(options: ReadModulesOptions): Promise<Modules> {
  const project = new Project({
    baseDir: options.baseDir,
    encoding: options.encoding || "utf8"
  })
  const modulePaths = options.modulePaths || await getModulePathsInDir(options.baseDir)
  const modules = await project.parseModules(modulePaths)
  return modules
}

async function getModulePathsInDir(dir: string): Promise<string[]> {
  const files = await readdir(dir)
  return files
    .filter(fileName => fileName.endsWith(".rto.json"))
    .map(fileName => `./${fileName}`)
}