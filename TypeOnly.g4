grammar TypeOnly;

defs: (interfac)*;
interfac: INTERFACE name BEGIN (property NEWLINE)* END;
name: ID;
property: name TWOPOINT primitiveType;
primitiveType: STRING | NUMBER;

INTERFACE: 'interface';
STRING: 'string';
NUMBER: 'number';
BEGIN: '{';
END: '}';
ID: [a-zA-Z_] [a-zA-Z0-9_]*;
TWOPOINT: ':';
NEWLINE: ('\r'? '\n' | '\r');
WS: [ \t\f]+ -> channel(HIDDEN);