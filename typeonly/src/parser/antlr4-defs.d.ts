export interface AntlrParser {
  ruleNames: { [type: number]: string; };
  symbolicNames: { [type: number]: string; };
}

export interface AntlrTokenStream {
  tokens: AntlrToken[];
  // getHiddenTokensToLeft(tokenIndex: number, channel: number): AntlrToken[] | null
  // getHiddenTokensToRight(tokenIndex: number, channel: number): AntlrToken[] | null
}

export type ParseTree = AntlrRuleContext | AntlrTerminalNode;

export interface AntlrRuleContext {
  [childName: string]: any;
  parentCtx: AntlrRuleContext;
  parser: AntlrParser;
  ruleIndex: number;
  start: AntlrToken;
  stop: AntlrToken;
  getText(): string;
  getChild(index: number): ParseTree | null;
  getChildCount(): number;
}

export type AntlrAnyRuleContext = AntlrRuleContext & {
  [childrenName: string]: any;
};

export interface AntlrTerminalNode {
  parentCtx: AntlrRuleContext;
  symbol: AntlrToken;
  getText(): string;
}

export interface AntlrToken {
  tokenIndex: number;
  channel: number;
  type: number;
  start: number;
  stop: number;
  line: number;
  column: number;
}