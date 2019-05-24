parser grammar TypeOnlyParser;

options {
  tokenVocab = TypeOnlyLexer;
}

declarations: typeSep? declaration*;

typeSep: (NL | SEMI_COLON)+;

declaration:
  namedInterface typeSep?
  | namedType (typeSep | EOF);

/*
 * NamedInterface
 */
namedInterface:
  (EXPORT NL?)? INTERFACE IDENTIFIER (NL? interfaceExtends)? NL? anonymousInterface;

interfaceExtends:
  EXTENDS NL? typeName (NL? COMMA NL? typeName)*;

anonymousInterface:
  OPEN_BRACE (NL? interfaceEntries)? NL? CLOSE_BRACE;

interfaceEntries:
  interfaceEntry (propertySeparator interfaceEntry)*;

interfaceEntry: property | functionProperty;

property:
  (READONLY NL?)? propertyName (NL? QUESTION_MARK)? NL? COLON NL? aType;

functionProperty:
  (READONLY NL?)? propertyName (NL? QUESTION_MARK)? NL? OPEN_PARENTHESE (
    NL? functionParameter (NL? COMMA NL? functionParameter)*
  )? NL? CLOSE_PARENTHESE (NL? COLON NL? aType)?;

propertySeparator: NL | NL? SEMI_COLON+ NL? | NL? COMMA NL?;

propertyName: IDENTIFIER | JS_KEYWORD;

typeName: IDENTIFIER;

/*
 * NamedType
 */
namedType: (EXPORT NL?)? TYPE IDENTIFIER NL? ASSIGN NL? aType;

/*
 * Common rules for NamedInterface and NamedType
 */
aType:
  OPEN_PARENTHESE (
    NL? functionParameter (NL? COMMA NL? functionParameter)*
  )? NL? CLOSE_PARENTHESE NL? ARROW NL? aType
  | aType NL? INTERSECTION NL? aType
  | aType NL? UNION NL? aType
  | aType NL? OPEN_BRACKET NL? CLOSE_BRACKET
  | IDENTIFIER
  | literal
  | anonymousInterface
  | typeWithParenthesis
  | tupleType
  | genericType;

// TODO: Ask to Mr Thomas if is true: Array can have null type and must have OPEN_PARENTHESE CLOSE_PARENTHESE at the end
genericType:
  IDENTIFIER NL? LESS_THAN (NL? aType (NL? COMMA NL? aType)*)? NL? MORE_THAN;
tupleType:
  OPEN_BRACKET (NL? aType (NL? COMMA NL? aType)*)? NL? CLOSE_BRACKET;
typeWithParenthesis:
  OPEN_PARENTHESE NL? aType NL? CLOSE_PARENTHESE;
functionParameter: IDENTIFIER (NL? COLON NL? aType)?;

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
