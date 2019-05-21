parser grammar TypeOnlyParser;

options {
  tokenVocab = TypeOnlyLexer;
}

declarations: NewLine? (namedInterface | namedType)*;

/*
 * NamedInterface
 */
namedInterface:
  Export? WS? Interface WS? Identifier WS? interfaceExtends? NewLine? anonymousInterface typeSep*;
interfaceExtends: (
    Extends WS? typeName ( WS? Comma WS? typeName)*
  );
anonymousInterface:
  OpenBrace NewLine? (
    (property | functionProperty) propertySeparator*
  )* CloseBrace;
property:
  ReadOnly? WS? propertyName WS? QuestionMark? WS? Colon WS? aType;
functionProperty:
  ReadOnly? WS? propertyName WS? QuestionMark? OpenBracket WS? functionParameter* CloseBracket WS?
    Colon WS? aType;
propertySeparator: NewLine | SemiColon | Comma;
propertyName: Identifier | JsKeyword;
typeName: Identifier;

/*
 * NamedType
 */
namedType:
  Export? WS? Type WS? Identifier WS? Assign WS? aType typeSep*;

/*
 * Common rules for NamedInterface and NamedType
 */
//  TODO: Add CompositeType
aType: Identifier | literal | anonymousInterface | functionType;
functionType:
  OpenBracket WS? functionParameter* CloseBracket WS? Arrow WS? aType;
functionParameter:
  Identifier WS? Colon WS? aType propertySeparator*;
typeSep: WS | NewLine | SemiColon | Comma;

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