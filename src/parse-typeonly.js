const { CommonTokenStream, InputStream, tree: { ParseTreeWalker } } = require("antlr4")
const { TypeOnlyLexer } = require("../../antlr-parser/TypeOnlyLexer")
const { TypeOnlyParser } = require("../../antlr-parser/TypeOnlyParser")
const { AstExtractor } = require("./AstExtractor")

function parseTypeOnlyToAst(source) {
  const chars = new InputStream(source)
  const lexer = new TypeOnlyLexer(chars)
  const tokenStream = new CommonTokenStream(lexer)
  const parser = new TypeOnlyParser(tokenStream)

  parser.buildParseTrees = true
  parser.removeErrorListeners()
  const errors = []
  parser.addErrorListener({
    syntaxError(recognizer, offendingSymbol, line, column, msg, e) {
      errors.push(`Syntax error at line ${line}:${column}, ${msg}`)
    }
  })

  const tree = parser.script()

  const extractor = new AstExtractor()
  ParseTreeWalker.DEFAULT.walk(extractor, tree)

  if (errors.length > 0)
    throw new Error(errors.join("\n"))

  return extractor.ast
}

exports.parseTypeOnlyToAst = parseTypeOnlyToAst