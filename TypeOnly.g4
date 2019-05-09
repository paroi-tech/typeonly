grammar TypeOnly;

// Parser Rules

defs: (separator)*? (interfac)*;
name: ID;
interfac:
  Interface WS? name (separator)*? OpenBrace (separator)*? (
    property propertySeparator (separator)*?
  )* CloseBrace (separator)*?;
propertySeparator:
  NewLine
  | SemiColon
  | Comma
  | SemiColon NewLine
  | Comma NewLine;
separator: NewLine | WS;
property: name WS? Colon WS? primitiveType;
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

ID: (
    Underscore
    | Letter
    | Dollar
    | Underscore Dollar
    | Dollar Underscore
  ) (Letter | Underscore | Digit)*;

// New line
NewLine: ('\r'? '\n' | '\r');

// Comments
MultiLineComment: '/*' .*? '*/' -> channel(HIDDEN);
SingleLineComment: '//' .*? [\r|\n] -> channel(HIDDEN);

// WhiteSpaces WS: (' ')+ -> channel(HIDDEN); WhiteSpaces: [\t\u000B\u000C\u0020\u00A0]+ ->
// channel(HIDDEN); WS: [\t\u000B\u000C\u0020\u00A0]+;
WS: [ \t\f]+ -> channel(HIDDEN);