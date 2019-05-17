parser grammar TypeOnlyParser;

options {
  tokenVocab = TypeOnlyLexer;
}

defs: separator* elements;
elements: element*;
element: namedInterface | namedType;

/*
 * NamedInterface
 */
namedInterface:
  Export? WS? Interface WS? Identifier WS? extend? separator* anonymousInterface interfaceSeparator*
    ;
extend: (Extends WS? typeName ( WS? Comma WS? typeName)*);
anonymousInterface:
  OpenBrace separator* (
    (property | functionProperty) propertySeparator*
  )* CloseBrace;
property:
  ReadOnly? WS? propertyName WS? QuestionMark? WS? Colon WS? aType;
functionProperty:
  ReadOnly? WS? propertyName WS? QuestionMark? OpenBracket WS? params* CloseBracket WS? Colon WS?
    aType;
propertySeparator: NewLine | SemiColon | Comma;
propertyName: Identifier | JsKeyword;
typeName: Identifier;
separator: NewLine | WS;

/*
 * NamedType
 */
namedType:
  Export? WS? Type WS? Identifier WS? Assign WS? aType interfaceSeparator*;

/*
 * Common rules for NamedInterface and NamedType
 */
aType: Identifier | literal | anonymousInterface | functionType;
functionType:
  OpenBracket WS? params* CloseBracket WS? Assign MoreThan WS? Identifier;
params: Identifier WS? Colon WS? aType propertySeparator*;
interfaceSeparator: WS | NewLine | SemiColon | Comma;

/*
 * Literal
 */
literal:
  TemplateStringLiteral* NullLiteral
  | BooleanLiteral
  | StringLiteral
  | BigIntLiteral
  | NumberLiteral
  | TemplateStringLiteral
  | numericLiteral TemplateStringLiteral*;
numericLiteral:
  DecimalLiteral
  | HexIntegerLiteral
  | OctalIntegerLiteral
  | OctalIntegerLiteral2
  | BinaryIntegerLiteral;