parser grammar TypeOnlyParser;

options {
  tokenVocab = TypeOnlyLexer;
}

declarations: typeSep? declaration*;

typeSep: (NewLine | SemiColon)+;

declaration:
  namedInterface typeSep?
  | namedType (typeSep | EOF);

/*
 * NamedInterface
 */
namedInterface:
  Export? WS? Interface WS? Identifier WS? interfaceExtends? NewLine? anonymousInterface;

interfaceExtends: (
    Extends WS? typeName (WS? Comma WS? typeName)*
  );

anonymousInterface:
  OpenBrace NewLine? interfaceEntries? CloseBrace;

interfaceEntries:
  interfaceEntry (propertySeparator interfaceEntry)* NewLine?;

interfaceEntry: property | functionProperty;

property:
  ReadOnly? WS? propertyName WS? QuestionMark? WS? Colon WS? aType;

functionProperty:
  ReadOnly? WS? propertyName WS? QuestionMark? OpenBracket (
    functionParameter (Comma functionParameter)*
  )? CloseBracket WS? (Colon WS? aType)?;

propertySeparator:
  NewLine+
  | NewLine* SemiColon NewLine*
  | NewLine* Comma NewLine*;

propertyName: Identifier | JsKeyword;

typeName: Identifier;

/*
 * NamedType
 */
namedType: Export? WS? Type WS? Identifier WS? Assign WS? aType;

/*
 * Common rules for NamedInterface and NamedType
 */
//  TODO: Add CompositeType

aType:
  OpenBracket (functionParameter (Comma functionParameter)*)? CloseBracket Arrow aType
  | aType BitAnd aType
  | aType BitOr aType
  | Identifier
  | literal
  | anonymousInterface
  | typeWithParenthesis;

typeWithParenthesis: OpenBracket aType CloseBracket;

// compositeType: aType (BitAnd aType)+ | aType (BitOr aType)+;

// functionType: OpenBracket (functionParameter (Comma functionParameter)*)? CloseBracket Arrow
// aType;

functionParameter: Identifier (Colon aType)?;

/*
 * Literal
 */
literal:
  | StringLiteral
  | TemplateStringLiteral
  | BooleanLiteral
  | BigIntLiteral
  | IntegerLiteral
  | DecimalLiteral
  | HexIntegerLiteral
  | OctalIntegerLiteral
  | BinaryIntegerLiteral;