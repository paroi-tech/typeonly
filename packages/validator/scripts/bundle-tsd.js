import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const bundleName = "validator"
const compiledDir = join(__dirname, "declarations")
const packageDir = join(__dirname, "..")

try {
  writeFileSync(join(packageDir, "dist", `${bundleName}.d.ts`), makeDefinitionsCode())
} catch (err) {
  console.log(err.message, err.stack)
}

function makeDefinitionsCode() {
  const defs = [
    "// -- API Definitions --",
    cleanGeneratedCode(
      removeLocalImportsExports((readFileSync(join(compiledDir, "api.d.ts"), "utf-8")).trim()),
    ),
  ]
  return defs.join("\n\n")
}

function removeLocalImportsExports(code) {
  const localImportExport = /^\s*(import|export) .* from "\.\/.*"\s*;?\s*$/
  return code.split("\n").filter(line => {
    return !localImportExport.test(line)
  }).join("\n").trim()
}

function cleanGeneratedCode(code) {
  return code.replace(/;/g, "").replace(/    /g, "  ")
}
