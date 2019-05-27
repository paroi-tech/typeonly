const { CommonTokenStream, InputStream, tree: { ParseTreeWalker } } = require("antlr4")
const { TypeOnlyLexer } = require("../antlr-parser/TypeOnlyLexer")
const { TypeOnlyParser } = require("../antlr-parser/TypeOnlyParser")
const { AstExtractor } = require("./AstExtractor")

function parseTypeOnlyToAst(source) {
  const chars = new InputStream(source)
  const lexer = new TypeOnlyLexer(chars)
  const tokenStream = new CommonTokenStream(lexer)
  const parser = new TypeOnlyParser(tokenStream)

  parser.buildParseTrees = true

  const errors = []
  const errorListener = {
    syntaxError(recognizer, offendingSymbol, line, column, msg, e) {
      errors.push(`Syntax error at line ${line}:${column}, ${msg}`)
    }
  }
  lexer.removeErrorListeners()
  lexer.addErrorListener(errorListener)
  parser.removeErrorListeners()
  parser.addErrorListener(errorListener)

  const tree = parser.declarations()

  // console.log(debugTokensToText(tokenStream.tokens))
  // function debugTokensToText(tokens) {
  //   if (!tokens)
  //     return "-no-tokens-"
  //   return tokens.map(({ tokenIndex, type, start, stop }) => {
  //     return `[${tokenIndex}] ${type}: ${source.substring(start, stop + 1).replace(/\n/g, "\u23ce")}`
  //   }).join("\n")
  // }

  if (errors.length > 0)
    throw new Error(errors.join("\n"))

  const extractor = new AstExtractor({
    source,
    tokenStream,
    tokenTypes: {
      SEMICOLON: TypeOnlyParser.SEMICOLON,
      COMMA: TypeOnlyParser.COMMA,
      MULTILINE_COMMENT: TypeOnlyParser.MULTILINE_COMMENT,
      SINGLE_LINE_COMMENT: TypeOnlyParser.SINGLE_LINE_COMMENT,
      NEWLINE: TypeOnlyParser.NL,
    }
  })
  ParseTreeWalker.DEFAULT.walk(extractor, tree)

  return extractor.ast
}

exports.parseTypeOnlyToAst = parseTypeOnlyToAst