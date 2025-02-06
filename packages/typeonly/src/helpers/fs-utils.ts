import { type MakeDirectoryOptions, existsSync, mkdirSync, promises } from "node:fs";

const { access } = promises;

export async function pathExists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export function ensureDirSync(dir: string, options: MakeDirectoryOptions = {}) {
  if (!existsSync(dir)) mkdirSync(dir, options);
}
