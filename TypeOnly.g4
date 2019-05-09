grammar TypeOnly;

// Parser Rules

defs: (interfac)*;
name: ID;
interfac:
  Interface ' ' name separator? OpenBrace separator? (
    property propertySeparator
  )* CloseBrace separator?;
propertySeparator:
  NewLine
  | SemiColon
  | Comma
  | SemiColon NewLine
  | Comma NewLine;
separator: NewLine | ' ';
property: name Colon primitiveType;
primitiveType: String | Number;

// Lexer Rules

fragment Digit: [0-9];
fragment Letter: [a-zA-Z];
fragment Underscore: '_';
fragment Dollar: '$';

// Identifiers
Interface: 'interface';

// Keywords
String: 'string';
Number: 'number';

// Punctuation
OpenBrace: '{';
CloseBrace: '}';
Colon: ':';
SemiColon: ';';
Comma: ',';

ID: (Underscore | Letter | Dollar | Underscore Dollar | Dollar Underscore) (Letter | Underscore | Digit)*;

// New line
NewLine: ('\r'? '\n' | '\r');

// Comments
MultiLineComment: '/*' .*? '*/' -> channel(HIDDEN);
SingleLineComment: '//' .*? [\r|\n] -> channel(HIDDEN);

// WhiteSpaces
// WS: (' ')+ -> channel(HIDDEN);
WhiteSpaces: [ \t\f]+ -> channel(HIDDEN);