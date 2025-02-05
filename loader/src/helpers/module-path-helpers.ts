import { dirname } from "node:path";

export interface RelativeModulePath {
  from: string;
  relativeToModule?: string;
}

export interface ToModulePathOptions extends RelativeModulePath {
  removeExtensions?: string[];
}

export function toModulePath(options: ToModulePathOptions): string {
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
    return from;
  return `${parentDir}/${from}`;
}

function removeExtensions(path: string, extensions: string[]): string {
  for (const extension of extensions) {
    if (path.endsWith(extension))
      return path.substr(0, path.length - extension.length);
  }
  return path;
}