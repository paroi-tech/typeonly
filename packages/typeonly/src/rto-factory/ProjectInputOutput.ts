import { stat } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { TypeOnlyAstProvider } from "../api.js";
import { getExternalModulePath, parseExternalModuleName } from "../helpers/module-path-helpers.js";
import { parseTypeOnlyToAst } from "../parser/parse-typeonly.js";
import type { RtoModule, RtoModules } from "../rto.js";
import type { RtoModuleListener } from "./RtoProject.js";

export interface RtoProjectOutputOptions {
  writeFiles?: WriteRtoFilesOptions;
  returnRtoModules: boolean;
}

export interface WriteRtoFilesOptions {
  encoding: BufferEncoding;
  outputDir: string;
  /**
   * The indentation parameter of `JSON.stringify`.
   */
  prettify?: number | string;
}

export class RtoProjectOutput {
  readonly listener: RtoModuleListener;

  private modules = new Map<string, RtoModule>();

  constructor(options: RtoProjectOutputOptions) {
    this.listener = async (module: RtoModule, modulePath: string) => {
      if (options.writeFiles) await this.writeModuleFile(module, modulePath, options.writeFiles);
      if (options.returnRtoModules) this.modules.set(modulePath, module);
    };
  }

  getRtoModules(): RtoModules {
    const result: RtoModules = {};
    for (const [modulePath, module] of this.modules) result[modulePath] = module;
    return result;
  }

  private async writeModuleFile(
    module: RtoModule,
    modulePath: string,
    options: WriteRtoFilesOptions,
  ) {
    const data = JSON.stringify(module, undefined, options.prettify);
    const outputFile = `${join(options.outputDir, modulePath)}.rto.json`;
    await ensureDirectory(options.outputDir);
    await ensureDirectory(dirname(outputFile), { createIntermediate: true });
    await writeFile(outputFile, data, { encoding: options.encoding });
  }
}

export function makeReadSourceFileAstProvider(
  sourceDir: string,
  encoding: BufferEncoding,
): TypeOnlyAstProvider {
  return async (modulePath: string) => {
    const source = await readModuleFile(sourceDir, modulePath, encoding);
    return parseTypeOnlyToAst(source);
  };
}

async function readModuleFile(sourceDir: string, modulePath: string, encoding: BufferEncoding) {
  const parsedExternalModule = parseExternalModuleName(modulePath);
  const path = parsedExternalModule
    ? await getExternalModulePath(parsedExternalModule, sourceDir)
    : join(sourceDir, modulePath);
  try {
    return await readFile(`${path}.d.ts`, encoding);
  } catch {}
  try {
    return await readFile(`${path}.ts`, encoding);
  } catch {}
  throw new Error(`Cannot open module file: ${path}.d.ts`);
}

export async function ensureDirectory(path: string, { createIntermediate = false } = {}) {
  if (!(await fsExists(path))) await mkdir(path, { recursive: createIntermediate });
}

function fsExists(path: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    stat(path, (error) => resolve(!error));
  });
}
