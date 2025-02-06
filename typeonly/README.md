# TypeOnly

[![Build Status](https://travis-ci.com/paroi-tech/typeonly.svg?branch=master)](https://travis-ci.com/paroi-tech/typeonly)
[![npm](https://img.shields.io/npm/dm/typeonly)](https://www.npmjs.com/package/typeonly)
![Type definitions](https://img.shields.io/npm/types/typeonly)
[![GitHub](https://img.shields.io/github/license/paroi-tech/typeonly)](https://github.com/paroi-tech/typeonly)

A lightweight library for validating JSON data using TypeScript type definitions.

## Getting Started

```sh
npm install typeonly --save-dev
npm install @typeonly/validator
```

Add an entry to the `"scripts"` section of your `package.json` (this example uses a `typeonly/` directory for input and a `dist/` directory for output):

```json
    "typeonly": "typeonly --bundle dist/types.to.json -s ./typeonly"
```

Create a type file with a `.d.ts` extension:

```ts
// typeonly/my-types.d.ts

export type Task = RedTask | BlueTask;

export interface RedTask {
  color: "red";
  priority: number | "max";
  label: string;
}

export interface BlueTask {
  color: "blue";
  label: string;
}
```

_Important: TypeOnly uses its own parser and implements only a subset of TypeScript. Specifically, generics and template string types are not supported._

Generate the type bundle by running:

```sh
npm run typeonly
```

A new file `dist/types.to.json` will be generated containing all the type definitions from the input directory. Being a JSON file, the parser is not needed at runtime.

### Validating JSON Data (ESM Version)

```js
import { readFileSync } from "node:fs";
import { createValidator } from "@typeonly/validator";

const typeValidator = createValidator({
  bundle: JSON.parse(readFileSync("./dist/types.to.json", "utf-8")),
});

const result1 = typeValidator.validate("Task", {
  color: "red",
  priority: 2,
  label: "My urgent task"
});

console.log(result1); // { valid: true }

const result2 = typeValidator.validate("Task", {
  color: "red",
  priority: "abc",
  label: "My urgent task"
});

console.log(result2); // { valid: false, error: 'Value...' }
```

The error message looks like:

```
Value {color: "red", priority: "abc", label: "My urgent ta…"} is not conform to Task: no matching type in: RedTask | BlueTask.
In type 'RedTask', value {color: "red", priority: "abc", label: "My urgent ta…"} is not conform to RedTask.
In property 'priority', value '"abc"' is not conform to union: no matching type in: number | "max".
```

### Validating JSON Data (CommonJS Version)

```js
const { readFileSync } = require("node:fs");

async function main() {
  const { createValidator } = await import("@typeonly/validator");

  // … same code as in the ESM version …
}

main();
```

## Command Line Interface

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

## Using as a Library

Install as a dependency:

```sh
npm install typeonly --save-dev
```

Then, use it:

```js
import { generateRtoModules } from "typeonly";

const bundle = await generateRtoModules({
  modulePaths: ["./file-name"],
  readFiles: {
    sourceDir: `../types`
  },
  returnRtoModules: true
}).catch(console.log);
```