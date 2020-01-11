# @typeonly/checker-cli

<!-- [![Build Status](https://travis-ci.com/tomko-team/typeonly-checker-cli.svg?branch=master)](https://travis-ci.com/tomko-team/typeonly-checker-cli)
[![Dependencies Status](https://david-dm.org/tomko-team/typeonly-checker-cli/status.svg)](https://david-dm.org/tomko-team/typeonly-checker-cli)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/8a2c29e43ddf401fa7e5f80e96efdcc2)](https://www.codacy.com/manual/paleo/typeonly-checker-cli?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=tomko-team/typeonly-checker-cli&amp;utm_campaign=Badge_Grade) -->
[![Build Status](https://travis-ci.com/tomko-team/typeonly.svg?branch=master)](https://travis-ci.com/tomko-team/typeonly)
[![npm](https://img.shields.io/npm/dm/@typeonly/checker-cli)](https://www.npmjs.com/package/@typeonly/checker-cli)
![Type definitions](https://img.shields.io/npm/types/@typeonly/checker-cli)
![GitHub](https://img.shields.io/github/license/tomko-team/typeonly)

[TypeOnly](https://github.com/tomko-team/typeonly/tree/master/typeonly) aims to be the pure typing part of TypeScript. This package provides a Command Line Interface to validate JSON with TypeScript definitions, using the TypeOnly parser.

## Tutorial: How to check the conformity of a JSON file using the CLI

Create a file _"drawing.d.ts"_ with the following code:

```ts
// drawing.d.ts

export interface Drawing {
  color: ColorName
  dashed?: boolean
  shape: Rectangle | Circle
}

export type ColorName = "red" | "green" | "blue"

export interface Rectangle {
  kind: "rectangle",
  x: number
  y: number
  width: number
  height: number
}

export interface Circle {
  kind: "circle",
  x: number
  y: number
  radius: number
}
```

Then, create a JSON file _"drawing.json"_ that must be of type `Drawing`:

```json
{
  "color": "green",
  "shape": {
    "kind": "circle",
    "x": 100,
    "y": 100,
    "radius": "wrong value"
  }
}
```

We are ready to check the JSON file:

```sh
$ npx @typeonly/checker-cli -s drawing.d.ts -t "Drawing" drawing.json
In property 'radius', value '"wrong value"' is not conform to number.
```

A mistake is detected in the JSON file. Fix it by replacing the value of the property `"radius"` with a valid number. For example: `"radius": 50`. And run the command again:

```sh
$ npx @typeonly/checker-cli -s drawing.d.ts -t "Drawing" drawing.json
```

Good. The checker no longer complain.

## Options of Command Line Interface

Example of command:

```sh
npx @typeonly/checker-cli -s src/file-name.d.ts -t RootTypeName data.json
```

Available options:

```
  -h, --help                       Print this help message.
  -s, --source file.d.ts           The typing file (one file allowed).
  --source-encoding string         Encoding for typing files (default is utf8).
  --source-dir directory           The source directory that contains typing files (optional).
  --rto-module file.rto.json       The rto.json file to process (one file allowed).
  --rto-dir directory              The source directory for rto.json file (optional).
  -t, --type string                The type name of the root element in JSON.
  --non-strict                     Enable non-strict mode (accept extra properties).
  -e, --json-encoding string       Encoding for JSON file to check (default is utf8).
  --json file.json                 The JSON file to check (by default at last position, one file allowed).
```

## Contribute

With VS Code, our recommanded plugin is:

- **TSLint** from Microsoft (`ms-vscode.vscode-typescript-tslint-plugin`)
