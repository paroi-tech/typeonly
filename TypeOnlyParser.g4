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
  (EXPORT NL?)? INTERFACE IDENTIFIER (NL? genericDecl)? (
    NL? interfaceExtends
  )? NL? anonymousInterface;

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
  (READONLY NL?)? propertyName (NL? QUESTION_MARK)? NL? (
    NL? genericDecl
  )? OPEN_PARENTHESE (
    NL? functionParameter (NL? COMMA NL? functionParameter)*
  )? NL? CLOSE_PARENTHESE (NL? COLON NL? aType)?;

propertySeparator: NL | NL? SEMI_COLON+ NL? | NL? COMMA NL?;

propertyName: IDENTIFIER | JS_KEYWORD;

typeName: IDENTIFIER;

/*
 * NamedType
 */
namedType: (EXPORT NL?)? TYPE IDENTIFIER NL? (NL? genericDecl)? ASSIGN NL? aType;

/*
 * Common rules for NamedInterface and NamedType
 */
aType:
  inlineImportType
  | IDENTIFIER
  | literal
  | tupleType
  | KEYOF aType
  | aType NL? OPEN_BRACKET NL? CLOSE_BRACKET
  | anonymousInterface
  | typeWithParenthesis
  | aType NL? INTERSECTION NL? aType
  | aType NL? UNION NL? aType
  | genericType
  | (NL? genericDecl)? OPEN_PARENTHESE (
    NL? functionParameter (NL? COMMA NL? functionParameter)*
  )? NL? CLOSE_PARENTHESE NL? ARROW NL? aType;

genericDecl: LESS_THAN genericParameter+ MORE_THAN;
genericParameter:
  IDENTIFIER (EXTENDS extendsType = aType)? (
    ASSIGN defaultType = aType
  )?;
genericType:
  IDENTIFIER NL? LESS_THAN NL? aType (NL? COMMA NL? aType)* NL? MORE_THAN;
inlineImportType:
  IMPORT OPEN_PARENTHESE literal CLOSE_PARENTHESE DOT IDENTIFIER;

// genericType: IDENTIFIER NL? LESS_THAN NL? aType (NL? COMMA NL? aType)* NL? MORE_THAN;
// genericType: IDENTIFIER NL? LESS_THAN NL? genericParameter (NL? COMMA NL? genericParameter)* NL?
// MORE_THAN; genericParameter: IDENTIFIER (EXTENDS extendsType = aType)? (ASSIGN defaultType =
// aType)?
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
