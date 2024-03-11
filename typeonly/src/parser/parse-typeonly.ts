// @ts-ignore
import { ATNConfigSet, BitSet, CommonTokenStream, DFA, InputStream, ParseTreeWalker, Parser } from "antlr4"
import AstExtractor from "./AstExtractor"
const TypeOnlyLexer = require("../../antlr-parser/TypeOnlyLexer").default
const TypeOnlyParser = require("../../antlr-parser/TypeOnlyParser").default

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
    },
    // TODO: Remove this
    reportAttemptingFullContext(recognizer: Parser, dfa: DFA, startIndex: number, stopIndex: number, conflictingAlts: BitSet, configs: ATNConfigSet) {
      console.log("Error occurred: reportAttemptingFullContext", { startIndex, conflictingAlts, input: recognizer.getCurrentToken().text })
    },
    // TODO: Remove this
    reportContextSensitivity(recognizer: Parser, dfa: DFA, startIndex: number, stopIndex: number, prediction: number, configs: ATNConfigSet) {
      console.log("Error occurred: reportContextSensitivity", { startIndex, configs, input: recognizer.getCurrentToken().text, prediction })
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
      SEMICOLON: TypeOnlyParser.SEMI_COLON,
      COMMA: TypeOnlyParser.COMMA,
      MULTILINE_COMMENT: TypeOnlyParser.MULTILINE_COMMENT,
      SINGLE_LINE_COMMENT: TypeOnlyParser.SINGLE_LINE_COMMENT,
      NEWLINE: TypeOnlyParser.NL,
    }
  })

  ParseTreeWalker.DEFAULT.walk(extractor as any, declarations)

  return extractor.ast!
}
