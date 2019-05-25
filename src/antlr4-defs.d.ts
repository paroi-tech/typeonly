export interface AntlrParser {
  ruleNames: { [type: number]: string }
  symbolicNames: { [type: number]: string }
}

export interface AntlrTokenStream {
  tokens: AntlrToken[]
  getHiddenTokensToLeft(tokenIndex: number, channel: number): AntlrToken[] | null
  getHiddenTokensToRight(tokenIndex: number, channel: number): AntlrToken[] | null
}

export type ParseTree = AntlrRuleContext | AntlrTerminalNode

export interface AntlrRuleContext {
  parentCtx: AntlrRuleContext
  parser: AntlrParser
  ruleIndex: number
  start: AntlrToken
  stop: AntlrToken
  getText(): string
  getChild(index: number): ParseTree | null
  getChildCount(): number
}

export type AntlrAnyRuleContext = AntlrRuleContext & {
  [childrenName: string]: any
}

export interface AntlrTerminalNode {
  parentCtx: AntlrRuleContext
  symbol: AntlrToken
  getText(): string
}

export interface AntlrToken {
  tokenIndex: number
  channel: number
  type: number
  start: number
  stop: number
  line: number
  column: number
}

// /**
//  * Helper for ANTLR4.
//  * @param ctx A `ParseTree` instance: of type `TerminalNode` or `RuleContext`.
//  */
// export function ruleNameOf(ctx: ParseTree): string | undefined {
//   if (isAntlrRuleContext(ctx))
//     return ctx.parser.ruleNames[ctx.ruleIndex]
//   else if (isAntlrTerminalNode(ctx))
//     return ctx.parentCtx.parser.symbolicNames[ctx.symbol.type]
// }

// export function isAntlrRuleContext(ctx: ParseTree): ctx is AntlrRuleContext {
//   return !!ctx["parser"] && ctx["ruleIndex"] !== undefined
// }

// export function isAntlrTerminalNode(ctx: ParseTree): ctx is AntlrTerminalNode {
//   return !!ctx["parentCtx"] && !!ctx["symbol"]
// }