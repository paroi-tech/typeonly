parser grammar TypeOnlyParser;

options {
  tokenVocab = TypeOnlyLexer;
}

declarations: typeSep? declaration* EOF;

typeSep: (NL | SEMI_COLON)+;

declaration:
  importDecl (typeSep | EOF)
  | namedInterface typeSep?
  | namedType (typeSep | EOF);

/*
 * Import
 */
importDecl: classicImport | namespacedImport;

classicImport:
  IMPORT TYPE? NL* (namedImportContent NL* FROM NL*)? STRING_LITERAL;

namedImportContent:
  OPEN_BRACE NL* namedMember (NL* COMMA NL* namedMember)* NL* CLOSE_BRACE;

namedMember: IDENTIFIER (NL* AS NL* IDENTIFIER)?;

namespacedImport:
  IMPORT NL* STAR NL* AS NL* IDENTIFIER NL* FROM NL* STRING_LITERAL;

/*
 * NamedInterface
 */
namedInterface:
  (EXPORT NL*)? INTERFACE IDENTIFIER (NL* genericParameters)? (
    NL* interfaceExtends
  )? NL* anonymousInterface;

interfaceExtends:
  EXTENDS NL* typeName (NL* COMMA NL* typeName)*;

anonymousInterface:
  OPEN_BRACE (NL* interfaceEntries)? CLOSE_BRACE;

interfaceEntries:
  interfaceEntry (propertySeparator interfaceEntry)* propertySeparator?;

interfaceEntry:
  indexSignature
  | property
  | functionProperty
  | mappedIndexSignature;

property:
  (READONLY NL*)? propertyName (NL* QUESTION_MARK)? NL* COLON NL* aType;

functionProperty:
  (READONLY NL*)? propertyName (NL* QUESTION_MARK)? NL* (
    NL* genericParameters
  )? OPEN_PARENTHESE (
    NL* functionParameter (NL* COMMA NL* functionParameter)*
  )? NL* CLOSE_PARENTHESE (NL* COLON NL* aType)?;

/*
 * IndexSignature and MappedIndexSignature
 */
indexSignature:
  (READONLY NL*)? OPEN_BRACKET IDENTIFIER COLON signatureType CLOSE_BRACKET (
    NL* QUESTION_MARK
  )? COLON aType;
signatureType: STRING | NUMBER;
mappedIndexSignature:
  (READONLY NL*)? OPEN_BRACKET IDENTIFIER IN aType CLOSE_BRACKET (
    NL* QUESTION_MARK
  )? COLON aType;

propertySeparator: (NL+ (propertyExplicitSeparator NL*)?) | (propertyExplicitSeparator NL*);
propertyExplicitSeparator: (SEMI_COLON (NL* SEMI_COLON)*) | COMMA;

propertyName: IDENTIFIER | JS_KEYWORD | typeOnlyKeywords;
typeOnlyKeywords:
  INTERFACE
  | TYPE
  | EXPORT
  | EXTENDS
  | READONLY
  | KEYOF
  | STRING
  | NUMBER
  | IN
  | AS
  | FROM
  | IMPORT;

typeName: IDENTIFIER | IDENTIFIER DOT IDENTIFIER;

/*
 * NamedType
 */
namedType: (EXPORT NL*)? TYPE IDENTIFIER NL* (
    NL* genericParameters
  )? ASSIGN NL* aType;

/*
 * Common rules for NamedInterface and NamedType
 */
aType:
  inlineImportType
  | typeName
  | signatureType
  | literal
  | tupleType
  | memberParentType = aType OPEN_BRACKET memberName CLOSE_BRACKET
  | arrayItemType = aType NL* OPEN_BRACKET NL* CLOSE_BRACKET
  | KEYOF aType
  | anonymousInterface
  | typeWithParenthesis
  | aType NL* INTERSECTION NL* aType
  | INTERSECTION NL* aType
  | aType NL* UNION NL* aType
  | UNION NL* aType
  | genericInstance
  | (NL* genericParameters)? OPEN_PARENTHESE (
    NL* functionParameter (NL* COMMA NL* functionParameter)*
  )? NL* CLOSE_PARENTHESE NL* ARROW NL* returnType = aType;

memberName: STRING_LITERAL | INTEGER_LITERAL | IDENTIFIER;

genericParameters: LESS_THAN genericParameter+ MORE_THAN;
genericParameter:
  IDENTIFIER (EXTENDS extendsType = aType)? (
    ASSIGN defaultType = aType
  )?;
genericInstance:
  typeName NL* LESS_THAN NL* aType (NL* COMMA NL* aType)* NL* MORE_THAN;
inlineImportType:
  IMPORT OPEN_PARENTHESE stringLiteral CLOSE_PARENTHESE DOT IDENTIFIER;

stringLiteral: STRING_LITERAL | TEMPLATE_STRING_LITERAL;

tupleType:
  OPEN_BRACKET (NL* aType (NL* COMMA NL* aType)*)? NL* CLOSE_BRACKET;
typeWithParenthesis:
  OPEN_PARENTHESE NL* aType NL* CLOSE_PARENTHESE;
functionParameter: IDENTIFIER (NL* QUESTION_MARK)? (NL* COLON NL* aType)?;

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
