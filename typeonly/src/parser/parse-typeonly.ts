// @ts-ignore
import { CommonTokenStream, InputStream, tree } from "antlr4"
import AstExtractor from "./AstExtractor"
const { TypeOnlyLexer } = require("../../antlr-parser/TypeOnlyLexer")
const { TypeOnlyParser } = require("../../antlr-parser/TypeOnlyParser")

export function parseTypeOnlyToAst(source: string) {
  const chars = new InputStream(source)
  const lexer = new TypeOnlyLexer(chars)
  const tokenStream = new CommonTokenStream(lexer)
  const parser = new TypeOnlyParser(tokenStream)

  parser.buildParseTrees = true

  const errors: string[] = []
  const errorListener = {
    syntaxError(recognizer: any, offendingSymbol: any, line: number, column: number, msg: string, e: any) {
      errors.push(`Syntax error at line ${line}:${column}, ${msg}`)
    }
  }
  lexer.removeErrorListeners()
  lexer.addErrorListener(errorListener)
  parser.removeErrorListeners()
  parser.addErrorListener(errorListener)

  const declarations = parser.declarations()

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
  tree.ParseTreeWalker.DEFAULT.walk(extractor, declarations)

  return extractor.ast!
}
