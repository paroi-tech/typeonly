const { parseTypeOnlyToAst } = require("./parse-typeonly")

const test = `
abc = 2 * 3
def = "AAA"
`

parseTypeOnlyToAst(test)
