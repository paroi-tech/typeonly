import antlr4, { CommonTokenStream, InputStream, type Recognizer } from "antlr4";
import AstExtractor from "./AstExtractor.js";

const TypeOnlyLexer = (await import("../../antlr-parser/TypeOnlyLexer.js" as string)).default;
const TypeOnlyParser = (await import("../../antlr-parser/TypeOnlyParser.js" as string)).default;

export function parseTypeOnlyToAst(source: string) {
  const chars = new InputStream(source);
  const lexer = new TypeOnlyLexer(chars);
  const tokenStream = new CommonTokenStream(lexer);
  const parser = new TypeOnlyParser(tokenStream);

  parser.buildParseTrees = true;

  // parser.removeParseListeners();
  // parser.addParseListener(errorListener);

  // console.log(debugTokensToText(tokenStream.tokens))
  // function debugTokensToText(tokens) {
  //   if (!tokens)
  //     return "-no-tokens-"
  //   return tokens.map(({ tokenIndex, type, start, stop }) => {
  //     return `[${tokenIndex}] ${type}: ${source.substring(start, stop + 1).replace(/\n/g, "\u23ce")}`
  //   }).join("\n")
  // }

  const errors: string[] = [];
  const errorListener = {
    syntaxError(
      _recognizer: any,
      _offendingSymbol: any,
      line: number,
      column: number,
      msg: string,
      _e: any,
    ) {
      errors.push(`Syntax error at line ${line}:${column}, ${msg}`);
    },

    reportAmbiguity(
      recognizer: Recognizer<any>,
      dfa: any,
      startIndex: number,
      stopIndex: number,
      exact: boolean,
      ambigAlts: any,
      configs: any,
    ) {},

    reportAttemptingFullContext(
      recognizer: Recognizer<any>,
      dfa: any,
      startIndex: number,
      stopIndex: number,
      conflictingAlts: any,
      configs: any,
    ) {},

    reportContextSensitivity(
      recognizer: Recognizer<any>,
      dfa: any,
      startIndex: number,
      stopIndex: number,
      prediction: number,
      configs: any,
    ) {},
  };
  lexer.removeErrorListeners();
  lexer.addErrorListener(errorListener);
  parser.removeErrorListeners();
  parser.addErrorListener(errorListener);

  const treeRoot = parser.declarations();

  if (errors.length > 0) throw new Error(errors.join("\n"));

  const extractor = new AstExtractor({
    source,
    tokenStream,
    tokenTypes: {
      SEMICOLON: TypeOnlyParser.SEMI_COLON,
      COMMA: TypeOnlyParser.COMMA,
      MULTILINE_COMMENT: TypeOnlyParser.MULTILINE_COMMENT,
      SINGLE_LINE_COMMENT: TypeOnlyParser.SINGLE_LINE_COMMENT,
      NEWLINE: TypeOnlyParser.NL,
    },
  });

  (antlr4 as any).tree.ParseTreeWalker.DEFAULT.walk(extractor, treeRoot);

  if (!extractor.ast) throw new Error("missing AST");

  return extractor.ast;
}
