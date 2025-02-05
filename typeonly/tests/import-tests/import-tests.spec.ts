import { dirname, join } from "node:path";
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from "vitest";
import { generateRtoModules } from "../../src/api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("Imports", () => {
  test("imports external packages", async () => {
    const result = await generateRtoModules({
      modulePaths: ["./proj01-types"],
      readFiles: {
        sourceDir: join(__dirname, "test-proj01", "types")
      },
      returnRtoModules: true
    });
    // console.log("result of imports", JSON.stringify(result, null, 2))
    expect(result).toBeDefined();
  });
});
