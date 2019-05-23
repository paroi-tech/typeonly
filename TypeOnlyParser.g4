parser grammar TypeOnlyParser;

options {
  tokenVocab = TypeOnlyLexer;
}

declarations: typeSep? declaration*;

typeSep: (NEW_LINE | SEMI_COLON)+;

declaration:
  namedInterface typeSep?
  | namedType (typeSep | EOF);

/*
 * NamedInterface
 */
namedInterface:
  EXPORT? WS? INTERFACE WS? IDENTIFIER WS? interfaceExtends? NEW_LINE? anonymousInterface;

interfaceExtends: (
    EXTENDS WS? typeName (WS? COMMA WS? typeName)*
  );

anonymousInterface:
  OPEN_BRACE NEW_LINE? interfaceEntries? CLOSE_BRACE;

interfaceEntries:
  interfaceEntry (propertySeparator interfaceEntry)* NEW_LINE?;

interfaceEntry: property | functionProperty;

property:
  READ_ONLY? WS? propertyName WS? QUESTION_MARK? WS? COLON WS? aType;

functionProperty:
  READ_ONLY? WS? propertyName WS? QUESTION_MARK? OPEN_BRACKET (
    functionParameter (COMMA functionParameter)*
  )? CLOSE_BRACKET WS? (COLON WS? aType)?;

propertySeparator:
  NEW_LINE+
  | NEW_LINE* SEMI_COLON NEW_LINE*
  | NEW_LINE* COMMA NEW_LINE*;

propertyName: IDENTIFIER | JS_KEYWORD;

typeName: IDENTIFIER;

/*
 * NamedType
 */
namedType: EXPORT? WS? TYPE WS? IDENTIFIER WS? ASSIGN WS? aType;

/*
 * Common rules for NamedInterface and NamedType
 */
aType:
  OPEN_BRACKET (functionParameter (COMMA functionParameter)*)? CLOSE_BRACKET ARROW aType
  | aType INTERSECTION aType
  | aType UNION aType
  | aType OPEN_HOOK CLOSE_HOOK
  | IDENTIFIER
  | literal
  | anonymousInterface
  | typeWithParenthesis
  | tupleType
  | genericType;

// TODO: Ask to Mr Thomas if is true: Array can have null type and must have OPEN_BRACKET CLOSE_BRACKET at the end
genericType:
  IDENTIFIER LESS_THAN (aType (COMMA aType)*)? MORE_THAN;
tupleType: OPEN_HOOK (aType (COMMA aType)*)? CLOSE_HOOK;
typeWithParenthesis: OPEN_BRACKET aType CLOSE_BRACKET;
functionParameter: IDENTIFIER (COLON aType)?;

/*
 * Literal
 */
literal:
  STRING_LITERAL
  | TEMPLATE_STRING_LITERAL
  | BOOLEAN_LITERAL
  | BIG_INT_LITERAL
  | INTEGER_LITERAL
  | DECIMAL_LITERAL
  | HEX_INTEGER_LITERAL
  | OCTAL_INTEGER_LITERAL
  | BINARY_INTEGER_LITERAL;
