import { AntlrRuleContext, AntlrToken, AntlrTokenStream } from "./antlr4-defs"

export interface CommentParsingContext {
  source: string
  tokenStream: AntlrTokenStream
  tokenTypes: {
    COMMA: number
    SEMICOLON: number
    MULTILINE_COMMENT: number
    SINGLE_LINE_COMMENT: number
    NEWLINE: number
  }
}

export interface GrabbedCommentsResult {
  standaloneCommentsBefore: GrabbedComment[]
  docComment?: string
  inlineComments: GrabbedComment[]
}

export interface GrabbedComment {
  text: string
  syntax: "inline" | "classic"
}

type Block = MultiLineBlock | SingleLinesBlock

interface MultiLineBlock {
  syntax: "classic"
  multiLineComment: AntlrToken
}

interface SingleLinesBlock {
  syntax: "inline"
  singleLineComments: AntlrToken[]
}

interface DocAndStandaloneComments {
  docComment: GrabbedComment | undefined
  standaloneComments: GrabbedComment[]
}

export default class CommentGrabber {
  private consumed = new Set<AntlrToken>()
  private lastTokenIndex = -1

  constructor(private parsingContext: CommentParsingContext) {
  }

  grabCommentsOf(ctx: AntlrRuleContext): GrabbedCommentsResult {
    const { tokenStream } = this.parsingContext
    this.lastTokenIndex = ctx.stop.tokenIndex

    const { docComment, standaloneComments } = this.grabDocAndStandaloneComments(
      tokenStream.getHiddenTokensToLeft(ctx.start.tokenIndex, 1)
    )
    const inlineComments = this.grabInlineComments(ctx)

    const result: GrabbedCommentsResult = {
      standaloneCommentsBefore: standaloneComments,
      inlineComments,
    }
    if (docComment)
      result.docComment = docComment.text
    return result
  }

  grabStandaloneCommentsAfterLast(): GrabbedComment[] {
    const { tokenStream } = this.parsingContext
    let hiddenTokens: AntlrToken[] | null
    if (this.lastTokenIndex === -1)
      hiddenTokens = tokenStream.tokens
    else
      hiddenTokens = tokenStream.getHiddenTokensToRight(this.lastTokenIndex, 1)
    const { standaloneComments } = this.grabDocAndStandaloneComments(hiddenTokens, "standaloneOnly")
    return standaloneComments
  }

  private grabDocAndStandaloneComments(tokens: AntlrToken[] | null, mode?: "standaloneOnly") {
    const blocks = this.tokensToBlocks(tokens)
    for (const block of blocks) {
      if (block.syntax === "inline")
        this.consumeTokens(block.singleLineComments)
      else
        this.consumeTokens([block.multiLineComment])
    }
    return this.blocksToDocAndStandaloneComments(blocks, mode)
  }

  private tokensToBlocks(tokens: AntlrToken[] | null): Block[] {
    if (!tokens)
      return []
    const { tokenTypes: { MULTILINE_COMMENT: ML_COM, SINGLE_LINE_COMMENT: SL_COM, NEWLINE } } = this.parsingContext
    tokens = keepWholeLineComments(tokens, NEWLINE, SL_COM)

    const blocks: Block[] = []
    let curSingleLinesBlock: SingleLinesBlock | undefined
    for (const token of tokens) {
      if (token.type === ML_COM) {
        blocks.push({
          syntax: "classic",
          multiLineComment: token
        })
        curSingleLinesBlock = undefined
      } else if (token.type === NEWLINE) {
        curSingleLinesBlock = undefined
      } else if (token.type === SL_COM) {
        if (!curSingleLinesBlock) {
          curSingleLinesBlock = {
            syntax: "inline",
            singleLineComments: []
          }
        }
        curSingleLinesBlock.singleLineComments.push(token)
        blocks.push(curSingleLinesBlock)
      }
    }
    return blocks
  }

  private blocksToDocAndStandaloneComments(blocks: Block[], mode?: "standaloneOnly"): DocAndStandaloneComments {
    const standaloneComments: GrabbedComment[] = []
    let docComment: GrabbedComment | undefined
    for (const block of blocks) {
      if (block.syntax === "inline") {
        const comment = this.singleLineTokensToStandaloneComment(block.singleLineComments)
        if (comment)
          standaloneComments.push(comment)
      } else {
        const docOrSa = this.multiLineTokenToDocOrStandaloneComment(block.multiLineComment)
        if (docOrSa) {
          const { doc, comment } = docOrSa
          if (doc && mode !== "standaloneOnly")
            docComment = comment
          else
            standaloneComments.push(comment)
        }
      }
    }
    return {
      standaloneComments,
      docComment
    }
  }

  private singleLineTokensToStandaloneComment(tokens: AntlrToken[]): GrabbedComment | undefined {
    if (tokens.length === 0)
      return
    const { source } = this.parsingContext
    const text = tokens
      .map(({ start, stop }) => formatInlineComment(source, start, stop, "asBlockLine"))
      .join("\n")
      .trimRight()
    if (text)
      return { syntax: "inline", text }
  }

  private multiLineTokenToDocOrStandaloneComment(token: AntlrToken)
    : { doc: boolean, comment: GrabbedComment } | undefined {
    const { source } = this.parsingContext
    const { start, stop } = token
    const { doc, text } = formatMultiLineComment(source, start, stop)
    if (text)
      return { doc, comment: { syntax: "classic", text } }
  }

  private grabInlineComments(ctx: AntlrRuleContext): GrabbedComment[] {
    const {
      tokenStream,
      tokenTypes: { COMMA, SEMICOLON, MULTILINE_COMMENT: ML_COM, SINGLE_LINE_COMMENT: SL_COM, NEWLINE }
    } = this.parsingContext
    const inlineComTokens: AntlrToken[] = []

    const stopIndex = this.getStopTokenIndexOf(ctx)
    for (let i = ctx.start.tokenIndex; i < stopIndex; ++i) {
      const type = tokenStream.tokens[i].type
      if (type !== COMMA && type !== SEMICOLON && type !== ML_COM && type !== SL_COM && type !== NEWLINE) {
        let rightTokens = tokenStream.getHiddenTokensToRight(i, 1)
        if (rightTokens) {
          rightTokens = rightTokens.filter(
            token => (token.type === ML_COM || token.type === SL_COM) && !this.consumed.has(token)
          )
          this.consumeTokens(rightTokens)
          inlineComTokens.push(...rightTokens)
        }
      }
    }

    const lastTokens = tokenStream.getHiddenTokensToRight(stopIndex, 1)
    if (lastTokens) {
      const lastToken = lastTokens.find(
        token => ((token.type === ML_COM || token.type === SL_COM) && !this.consumed.has(token))
          || token.type === NEWLINE
      )
      if (lastToken && (lastToken.type === ML_COM || lastToken.type === SL_COM)) {
        this.consumeTokens([lastToken])
        inlineComTokens.push(lastToken)
      }
    }

    return this.inlineTokensToGrabbedComments(inlineComTokens)
  }

  private getStopTokenIndexOf(ruleContext: AntlrRuleContext): number {
    const { COMMA, SEMICOLON } = this.parsingContext.tokenTypes
    const tokenAfter = this.parsingContext.tokenStream.tokens[ruleContext.stop.tokenIndex + 1]
    let stopIndex = ruleContext.stop.tokenIndex
    if (tokenAfter && (tokenAfter.type === COMMA || tokenAfter.type === SEMICOLON))
      ++stopIndex
    return stopIndex
  }

  private inlineTokensToGrabbedComments(tokens: AntlrToken[]): GrabbedComment[] {
    const { tokenTypes: { SINGLE_LINE_COMMENT: SL_COM } } = this.parsingContext
    const { source } = this.parsingContext
    return tokens
      .map(({ start, stop, type }) => {
        if (type === SL_COM)
          return formatInlineComment(source, start, stop)
        else
          return formatMultiLineComment(source, start, stop, "asInline").text
      })
      .filter(line => line.length > 0)
      .map(text => ({ syntax: "inline", text } as GrabbedComment))
  }

  private consumeTokens(tokens: AntlrToken[]) {
    tokens.forEach(tok => this.consumed.add(tok))
  }
}

function keepWholeLineComments(tokens: AntlrToken[], NEWLINE: number, SL_COM: number) {
  let prevWasNewLine = false
  let inNewLine = false
  return tokens.filter((token) => {
    if (token.type === NEWLINE) {
      if (inNewLine)
        return false
      if (prevWasNewLine)
        inNewLine = true
      prevWasNewLine = true
      return inNewLine
    }
    const keep = token.type !== SL_COM || (prevWasNewLine || token.tokenIndex === 0)
    prevWasNewLine = false
    inNewLine = false
    return keep
  })
}

function formatInlineComment(source: string, start: number, stop: number, mode?: "asBlockLine") {
  if (mode === "asBlockLine") {
    const index = start + (source[start + 2] === " " ? 3 : 2)
    return source.substring(index, stop + 1).trimRight()
  } else
    return source.substring(start + 2, stop + 1).trim()
}

function formatMultiLineComment(source: string, start: number, stop: number, mode?: "asInline")
  : { doc: boolean, text: string } {
  start += 2
  const length = stop - start - 1
  if (length <= 0)
    return { doc: false, text: "" }
  const doc = mode !== "asInline" && source[start] === "*"
  const raw = source.substr(doc ? start + 1 : start, length)

  let lines = raw.split("\n")
  const withPrefix = allLineHaveMultiLinePrefix(lines)
  if (withPrefix) {
    lines = lines.map(line => {
      const trimed = line.trim()
      return trimed === "" ? "" : trimed.slice(1)
    })
  } else
    lines = lines.map(line => line.trimRight())

  const text = lines.join(mode === "asInline" ? "; " : "\n")
  return { doc, text }
}

function allLineHaveMultiLinePrefix(lines: string[]) {
  const noPrefix = lines.find(line => {
    const trimed = line.trim()
    if (trimed === "")
      return false
    return trimed[0] !== "*"
  })
  return !noPrefix
}

// function debugTokensToText(tokens, parsingContext) {
//   if (!tokens)
//     return "-no-tokens-"
//   return tokens.map(({ tokenIndex, type, start, stop }) => {
//     return `[${tokenIndex}] ${type}: ${parsingContext.source.substring(start, stop + 1).replace("\n", "\\n")}`
//   }).join("\n")
// }