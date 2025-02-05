import { readFile } from "node:fs/promises";
import { dirname, join, normalize, resolve } from "node:path";
import { pathExists } from "./fs-utils.js";

export interface RelativeModulePath {
  from: string;
  relativeToModule?: string;
}

export interface ToModulePathOptions extends RelativeModulePath {
  removeExtensions?: string[];
}

export function toModulePath(options: ToModulePathOptions): string {
  if (parseExternalModuleName(options.from))
    return options.from;
  let from = options.removeExtensions
    ? removeExtensions(options.from, options.removeExtensions)
    : options.from;
  if (!from.startsWith("./") && !from.startsWith("../"))
    throw new Error("Module path must start with './' or '../'");
  let parentDir = options.relativeToModule ? dirname(options.relativeToModule) : ".";
  while (true) {
    if (from.startsWith("./"))
      from = from.substr(2);
    else if (from.startsWith("../")) {
      const newDir = dirname(parentDir);
      if (newDir === parentDir)
        break;
      parentDir = newDir;
      from = from.substr(3);
    } else
      break;
  }
  if (from.startsWith("../"))
    return normalize(from);
  const result = `${parentDir}/${from}`;
  if (result.startsWith("./"))
    return `./${normalize(result)}`;
  return normalize(result);
}

export interface ParsedExternalModuleName {
  packageName: string;
  additionalPath?: string;
}

export function parseExternalModuleName(modulePath: string): ParsedExternalModuleName | undefined {
  const result = /^((?:@[a-z0-9-~][a-z0-9-\._~]*\/)?[a-z0-9-~][a-z0-9-\._~]*)(\/.+)?$/.exec(modulePath);
  if (!result)
    return;
  return {
    packageName: result[1],
    additionalPath: result[2],
  };
}

export async function getExternalModulePath(parsed: ParsedExternalModuleName, sourceDir: string): Promise<string> {
  // console.log("==>", parsed, sourceDir)
  const mainPackageDir = await findParentPackageDir(sourceDir);
  // console.log("==. packageDir", mainPackageDir)
  if (!mainPackageDir)
    throw new Error(`Cannot find the package directory of '${sourceDir}'`);

  const depPackageDir = join(mainPackageDir, "node_modules", parsed.packageName);

  if (parsed.additionalPath)
    return join(depPackageDir, parsed.additionalPath);

  const content = JSON.parse(await readFile(join(depPackageDir, "package.json"), "utf8"));
  const additionalPath = content.types ?? content.typing;
  if (additionalPath)
    return join(depPackageDir, removeModuleNameExtension(additionalPath));
  return join(depPackageDir, "index");
}

function removeModuleNameExtension(fileName: string): string {
  if (!fileName.endsWith(".ts")) return fileName;
  return fileName.substring(0, fileName.length - (fileName.endsWith(".d.ts") ? 5 : 3));
}

async function findParentPackageDir(dir: string): Promise<string | undefined> {
  let resolvedDir = resolve(dir);
  while (true) {
    if (await pathExists(join(resolvedDir, "package.json")))
      return resolvedDir;
    if (resolvedDir === "/" || resolvedDir === ".")
      return;
    resolvedDir = dirname(resolvedDir);
  }
}

function removeExtensions(path: string, extensions: string[]): string {
  for (const extension of extensions) {
    if (path.endsWith(extension))
      return path.substr(0, path.length - extension.length);
  }
  return path;
}