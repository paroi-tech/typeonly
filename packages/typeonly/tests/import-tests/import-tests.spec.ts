import { join } from "path"
import { generateRtoModules } from "../../src/api"

describe("Imports", () => {
  test("imports external packages", async () => {
    const result = await generateRtoModules({
      modulePaths: ["./proj01-types"],
      readFiles: {
        sourceDir: join(__dirname, "test-proj01", "types")
      },
      returnRtoModules: true
    })
    // console.log("result of imports", JSON.stringify(result, null, 2))
    expect(result).toBeDefined()
  })
})
