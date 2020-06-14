# TypeOnly

[![Build Status](https://travis-ci.com/paroi-tech/typeonly.svg?branch=master)](https://travis-ci.com/paroi-tech/typeonly)
[![npm](https://img.shields.io/npm/dm/typeonly)](https://www.npmjs.com/package/typeonly)
![Type definitions](https://img.shields.io/npm/types/typeonly)
[![GitHub](https://img.shields.io/github/license/paroi-tech/typeonly)](https://github.com/paroi-tech/typeonly)

Parses types and interfaces from TypeScript and stores them as JSON files.

## What is TypeOnly?

The TypeOnly language aims to be the pure typing part of TypeScript. See also: a [detailed description of the language](https://github.com/paroi-tech/typeonly/blob/master/typeonly/typeonly-language.md).

## Why a new language?

TypeOnly is a new language but not a new syntax. TypeOnly aims to be and remain a strict subset of TypeScript: any code that compiles with TypeOnly will also compile with TypeScript. It is the "pure typing" part of TypeScript: only `interface` and `type` definitions.

TypeScript typing definitions are not available at runtime. Sometime this forces us to repeat ourselves, as in the following example:

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

## Tutorial: Parse TypeScript definitions with the CLI

In a new directory, install `typeonly` as a dependency:

```sh
npm init
npm install typeonly --save-dev
```

Edit the file `package.json` and add the following entry in the section `"scripts"`:

```json
  "scripts": {
    "typeonly": "typeonly --bundle dist/types.to.json --source-dir types"
  },
```

Create a subdirectory `types/`, then create a file _"types/drawing.d.ts"_ with the following code:

```ts
// types/drawing.d.ts

export interface Drawing {
  color: ColorName;
  dashed?: boolean;
  shape: Rectangle | Circle;
}

export type ColorName = "red" | "green" | "blue";

export interface Rectangle {
  kind: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Circle {
  kind: "circle";
  x: number;
  y: number;
  radius: number;
}
```

Now we can execute the TypeOnly parser via our script:

```sh
npm run typeonly
```

This command creates a file `dist/types.to.json`. A file with the `.to.json` extension is a bundle that contains metadata extracted from several `.d.ts` typing file.

## TypeOnly Documentation

### Using the CLI

Compile a typing source file:

```sh
npx typeonly --bundle dist/types.to.json --source-dir types
```

This command generates a compiled file `dist/types.to.json`.

Available options:

```
  -h, --help                   Print this help message.
  -o, --output-dir directory   The output directory (optional).
  -s, --source-dir directory   The source directory (optional when used with option --ast or with a single source file).
  -e, --encoding string        Encoding for input and output file(s) (default is utf8).
  -b, --bundle string          Generate a bundle file for RTO data (optional).
  --prettify                   Prettify RTO files (optional).
  --ast                        Generate AST files instead of RTO files (optional).
  --src file ...               Input files to process (by default at last position).
```

### Using the API

Install as a dependency:

```sh
npm install typeonly --save-dev
```

Then, use it:

```js
const { generateRtoModules } = require("typeonly");

const bundle = await generateRtoModules({
  modulePaths: ["./file-name"],
  readFiles: {
    sourceDir: `${__dirname}/types`
  },
  returnRtoModules: true
}).catch(console.log);
```

## Known Limitations

Generics are not implemented yet.

There is some kind of source code that can currently be parsed without error with TypeOnly, although it is invalid in TypeScript. This is a temporary limitation of our implementation. Do not use it! TypeOnly will always remain a strict subset of TypeScript. If you write some code that is incompatible with TypeScript, then future versions of TypeOnly could break your code.

An example of invalid TypeScript code that mistakenly can be parsed by the current version of TypeOnly:

```ts
interface I1 {
  [name: string]: boolean;
  p1: number; // TS Error: Property 'p1' of type 'number' is not assignable to string index type 'boolean'.
}
```

## Contribute

### Install and Build

We need a JVM (Java Virtual Machine) to build the parser because we use [ANTLR](https://www.antlr.org/), which is a Java program. So, at first, install a JVM on your system.

In a terminal, open the cloned `typeonly/typeonly/` repository. Then:

```sh
# Download once the ANTLR JAR file in the project's root directory
wget https://www.antlr.org/download/antlr-4.7.2-complete.jar

# Install once all Node.js dependencies
npm install
```

### Development environment

With VS Code, our recommanded plugins are:

- **ANTLR4 grammar syntax support** from Mike Lischke (`mike-lischke.vscode-antlr4`)
- **TSLint** from Microsoft (`ms-vscode.vscode-typescript-tslint-plugin`)
