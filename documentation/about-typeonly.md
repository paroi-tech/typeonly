# About TypeOnly

## What is TypeOnly?

TypeOnly aims to be the pure typing part of TypeScript. See also: a [detailed description of the language](https://github.com/paroi-tech/typeonly/blob/master/typeonly/typeonly-language.md).

TypeOnly is a new language but not a new syntax. TypeOnly aims to be and remain a strict subset of TypeScript: any code that compiles with TypeOnly will also compile with TypeScript. It is the "pure typing" part of TypeScript: only `interface` and `type` definitions.

With TypeScript, types definitions are not available at runtime. Sometime this forces us to repeat ourselves, as in the following example:

```ts
type ColorName = "red" | "green" | "blue";

function isColorName(name: string): name is ColorName {
  return ["red", "green", "blue"].includes(name);
}
```

This kind of code is not ideal. There is an [issue](https://github.com/microsoft/TypeScript/issues/3628) on Github related to this subject, and the TypeScript team is not ready to provide a solution.

The TypeOnly parser is implemented from scratch and does not require TypeScript as a dependency. It can be used outside a TypeScript project, such as in a JavaScript project, or to validate JSON data with a command line tool.

## How to use TypeOnly

There are three packages built on top of TypeOnly.

How to **load typing metadata at runtime**: use the package [@typeonly/loader](https://github.com/paroi-tech/typeonly/tree/master/loader).

How to **validate JSON data from the command line**: use the package [@typeonly/validator-cli](https://github.com/paroi-tech/typeonly/tree/master/validator-cli).

How to **validate JSON data or a JavaScript object using an API**: use the package [@typeonly/validator](https://github.com/paroi-tech/typeonly/tree/master/validator).

## Known Limitations

Generics are not implemented.

There is some kind of source code that can currently be parsed without error with TypeOnly, although it is invalid in TypeScript. This is a temporary limitation of our implementation. Do not use it! TypeOnly will always remain a strict subset of TypeScript. If you write some code that is incompatible with TypeScript, then future versions of TypeOnly could break your code.

An example of invalid TypeScript code that mistakenly can be parsed by the current version of TypeOnly:

```ts
interface I1 {
  [name: string]: boolean;
  p1: number; // TS Error: Property 'p1' of type 'number' is not assignable to string index type 'boolean'.
}
```
