import type { AntlrRuleContext, AntlrToken, AntlrTokenStream } from "./antlr4-defs.d.ts";

export interface CommentParsingContext {
  source: string;
  tokenStream: AntlrTokenStream;
  tokenTypes: {
    COMMA: number;
    SEMICOLON: number;
    MULTILINE_COMMENT: number;
    SINGLE_LINE_COMMENT: number;
    NEWLINE: number;
  };
}

export interface GrabbedCommentsResult {
  standaloneCommentsBefore: GrabbedComment[];
  docComment?: string;
  inlineComments: GrabbedComment[];
}

export interface GrabbedComment {
  text: string;
  syntax: "inline" | "classic";
}

type Block = MultiLineBlock | SingleLinesBlock;

interface MultiLineBlock {
  syntax: "classic";
  multiLineComment: AntlrToken;
}

interface SingleLinesBlock {
  syntax: "inline";
  singleLineComments: AntlrToken[];
}

interface DocAndStandaloneComments {
  docComment: GrabbedComment | undefined;
  standaloneComments: GrabbedComment[];
}

export default class CommentGrabber {
  private consumed = new Set<AntlrToken>();
  private lastTokenIndex = -1;

  constructor(private parsingContext: CommentParsingContext) {}

  grabCommentsOf(ctx: AntlrRuleContext): GrabbedCommentsResult {
    const {
      tokenStream,
      tokenTypes: { NEWLINE },
    } = this.parsingContext;
    this.lastTokenIndex = ctx.stop.tokenIndex;

    const tokens = getHiddenTokens({
      tokenStream,
      tokenIndex: ctx.start.tokenIndex,
      direction: "left",
      NEWLINE,
    });

    const { docComment, standaloneComments } = this.grabDocAndStandaloneComments(tokens);
    const inlineComments = this.grabInlineComments(ctx);

    const result: GrabbedCommentsResult = {
      standaloneCommentsBefore: standaloneComments,
      inlineComments,
    };
    if (docComment) result.docComment = docComment.text;
    return result;
  }

  grabStandaloneCommentsAfterLast(ctx?: AntlrRuleContext): GrabbedComment[] {
    const {
      tokenStream,
      tokenTypes: { NEWLINE },
    } = this.parsingContext;
    const tokens = getHiddenTokens({
      tokenStream,
      tokenIndex: this.lastTokenIndex,
      direction: "right",
      NEWLINE,
      startIndex: ctx ? ctx.start.start : undefined,
      stopIndex: ctx ? ctx.stop.stop : undefined,
    });
    const { standaloneComments } = this.grabDocAndStandaloneComments(tokens, "standaloneOnly");
    return standaloneComments;
  }

  private grabDocAndStandaloneComments(tokens: AntlrToken[] | null, mode?: "standaloneOnly") {
    const blocks = this.tokensToBlocks(tokens);
    for (const block of blocks) {
      if (block.syntax === "inline") this.consumeTokens(block.singleLineComments);
      else this.consumeTokens([block.multiLineComment]);
    }
    return this.blocksToDocAndStandaloneComments(blocks, mode);
  }

  private tokensToBlocks(tokens: AntlrToken[] | null): Block[] {
    if (!tokens) return [];
    const {
      tokenTypes: { MULTILINE_COMMENT: ML_COM, SINGLE_LINE_COMMENT: SL_COM, NEWLINE },
    } = this.parsingContext;
    const cleanedTokens = keepWholeLineComments(tokens, this.parsingContext);
    const blocks: Block[] = [];
    let curSingleLinesBlock: SingleLinesBlock | undefined;
    for (const token of cleanedTokens) {
      if (this.consumed.has(token)) continue;
      if (token.type === ML_COM) {
        blocks.push({
          syntax: "classic",
          multiLineComment: token,
        });
        curSingleLinesBlock = undefined;
      } else if (token.type === NEWLINE) {
        curSingleLinesBlock = undefined;
      } else if (token.type === SL_COM) {
        if (!curSingleLinesBlock) {
          curSingleLinesBlock = {
            syntax: "inline",
            singleLineComments: [],
          };
          blocks.push(curSingleLinesBlock);
        }
        curSingleLinesBlock.singleLineComments.push(token);
      }
    }
    return blocks;
  }

  private blocksToDocAndStandaloneComments(
    blocks: Block[],
    mode?: "standaloneOnly",
  ): DocAndStandaloneComments {
    const standaloneComments: GrabbedComment[] = [];
    let docComment: GrabbedComment | undefined;
    for (const block of blocks) {
      if (block.syntax === "inline") {
        const comment = this.singleLineTokensToStandaloneComment(block.singleLineComments);
        if (comment) standaloneComments.push(comment);
      } else {
        const docOrSa = this.multiLineTokenToDocOrStandaloneComment(block.multiLineComment);
        if (docOrSa) {
          const { doc, comment } = docOrSa;
          if (doc && mode !== "standaloneOnly") docComment = comment;
          else standaloneComments.push(comment);
        }
      }
    }
    return {
      standaloneComments,
      docComment,
    };
  }

  private singleLineTokensToStandaloneComment(tokens: AntlrToken[]): GrabbedComment | undefined {
    if (tokens.length === 0) return;
    const { source } = this.parsingContext;
    const text = tokens
      .map(({ start, stop }) => formatInlineComment(source, start, stop, "asBlockLine"))
      .join("\n");
    if (text) return { syntax: "inline", text };
  }

  private multiLineTokenToDocOrStandaloneComment(
    token: AntlrToken,
  ): { doc: boolean; comment: GrabbedComment } | undefined {
    const { source } = this.parsingContext;
    const { start, stop } = token;
    const { doc, text } = formatMultiLineComment(source, start, stop);
    if (text) return { doc, comment: { syntax: "classic", text } };
  }

  private grabInlineComments(ctx: AntlrRuleContext): GrabbedComment[] {
    const {
      tokenStream,
      tokenTypes: {
        COMMA,
        SEMICOLON,
        MULTILINE_COMMENT: ML_COM,
        SINGLE_LINE_COMMENT: SL_COM,
        NEWLINE,
      },
    } = this.parsingContext;
    const inlineComTokens: AntlrToken[] = [];

    const stopIndex = this.getStopTokenIndexOf(ctx);
    for (let i = ctx.start.tokenIndex; i < stopIndex; ++i) {
      const type = tokenStream.tokens[i].type;
      if (
        type !== COMMA &&
        type !== SEMICOLON &&
        type !== ML_COM &&
        type !== SL_COM &&
        type !== NEWLINE
      ) {
        let rightTokens = getHiddenTokens({
          tokenStream,
          tokenIndex: i,
          direction: "right",
          NEWLINE,
        });
        if (rightTokens) {
          rightTokens = rightTokens.filter(
            (token) =>
              (token.type === ML_COM || token.type === SL_COM) && !this.consumed.has(token),
          );
          this.consumeTokens(rightTokens);
          inlineComTokens.push(...rightTokens);
        }
      }
    }

    const lastTokens = getHiddenTokens({
      tokenStream,
      tokenIndex: stopIndex,
      direction: "right",
      NEWLINE,
    });
    if (lastTokens) {
      const lastToken = lastTokens.find(
        (token) =>
          ((token.type === ML_COM || token.type === SL_COM) && !this.consumed.has(token)) ||
          token.type === NEWLINE,
      );
      if (lastToken && (lastToken.type === ML_COM || lastToken.type === SL_COM)) {
        this.consumeTokens([lastToken]);
        inlineComTokens.push(lastToken);
      }
    }

    return this.inlineTokensToGrabbedComments(inlineComTokens);
  }

  private getStopTokenIndexOf(ruleContext: AntlrRuleContext): number {
    const { COMMA, SEMICOLON } = this.parsingContext.tokenTypes;
    const tokenAfter = this.parsingContext.tokenStream.tokens[ruleContext.stop.tokenIndex + 1];
    let stopIndex = ruleContext.stop.tokenIndex;
    if (tokenAfter && (tokenAfter.type === COMMA || tokenAfter.type === SEMICOLON)) ++stopIndex;
    return stopIndex;
  }

  private inlineTokensToGrabbedComments(tokens: AntlrToken[]): GrabbedComment[] {
    const {
      tokenTypes: { SINGLE_LINE_COMMENT: SL_COM },
    } = this.parsingContext;
    const { source } = this.parsingContext;
    const result: GrabbedComment[] = [];
    for (const { start, stop, type } of tokens) {
      let text: string;
      if (type === SL_COM) text = formatInlineComment(source, start, stop);
      else text = formatMultiLineComment(source, start, stop, "asInline").text;
      if (text.length > 0) result.push({ syntax: type === SL_COM ? "inline" : "classic", text });
    }
    return result;
  }

  private consumeTokens(tokens: AntlrToken[]) {
    tokens.forEach((tok) => this.consumed.add(tok));
  }
}

function keepWholeLineComments(tokens: AntlrToken[], parsingContext: CommentParsingContext) {
  const {
    tokenTypes: { SINGLE_LINE_COMMENT: SL_COM, NEWLINE },
  } = parsingContext;
  let newLineCount = 0;
  return tokens.filter((token) => {
    if (token.type === NEWLINE) {
      ++newLineCount;
      return newLineCount === 2;
    }
    const keep = token.type !== SL_COM || newLineCount > 0 || token.tokenIndex === 0;
    newLineCount = 0;
    return keep;
  });
}

function formatInlineComment(source: string, start: number, stop: number, mode?: "asBlockLine") {
  const index = start + (source[start + 2] === " " ? 3 : 2);
  if (mode === "asBlockLine") {
    return source.substring(index, stop + 1).trimEnd();
  }
  return source.substring(index, stop + 1).trim();
}

function formatMultiLineComment(
  source: string,
  start: number,
  stop: number,
  mode?: "asInline",
): { doc: boolean; text: string } {
  const length = stop - start - 3;
  if (length <= 0) return { doc: false, text: "" };
  const doc = mode !== "asInline" && source[start + 2] === "*";
  const raw = source.substr(doc ? start + 3 : start + 2, doc ? length - 1 : length);

  let lines = raw.split("\n");

  if (lines.length === 1) lines[0] = lines[0].trim();
  else if (mode !== "asInline" && haveMultiLineCommentPrefix(lines)) {
    lines = lines.map((line) => {
      const trimed = line.trim();
      return trimed === "" ? "" : trimed.slice(trimed[1] === " " ? 2 : 1);
    });
    if (lines[0] === "") lines.shift();
    if (lines[lines.length - 1] === "") lines.pop();
  } else {
    if (mode === "asInline") lines = lines.map((line) => line.trim());
    else lines = lines.map((line) => line.trimRight());
  }

  const text = lines.join(mode === "asInline" ? "; " : "\n");
  return { doc, text };
}

function haveMultiLineCommentPrefix(lines: string[]) {
  const noPrefix = lines.find((line) => {
    const trimed = line.trim();
    if (trimed === "") return false;
    return trimed[0] !== "*";
  });
  return !noPrefix;
}

interface GetHiddenTokensOptions {
  tokenStream: AntlrTokenStream;
  tokenIndex: number;
  direction: "left" | "right";
  NEWLINE: number;
  startIndex?: number;
  stopIndex?: number;
}

/**
 * Similar to the ANTLR API `BufferedTokenStream.prototype.getHiddenTokensToRight`, but with not-hidden NEWLINE
 */
function getHiddenTokens(options: GetHiddenTokensOptions): AntlrToken[] | null {
  const {
    tokenStream: { tokens },
    tokenIndex,
    direction,
    NEWLINE,
    startIndex,
    stopIndex,
  } = options;
  const hiddenChannel = 1;
  const len = tokens.length;
  if (tokenIndex < -1 || tokenIndex >= len) throw new Error(`Invalid tokenIndex: ${tokenIndex}`);
  const result: AntlrToken[] = [];
  const step = direction === "left" ? -1 : 1;
  for (let i = tokenIndex + step; i >= 0 && i < len; i += step) {
    const token = tokens[i];
    if (
      (startIndex !== undefined && token.tokenIndex < startIndex) ||
      (stopIndex !== undefined && token.tokenIndex > stopIndex) ||
      (token.channel !== hiddenChannel && token.type !== NEWLINE)
    )
      break;
    result.push(token);
  }
  if (result.length === 0) return null;
  if (direction === "left") result.reverse();
  return result;
}
