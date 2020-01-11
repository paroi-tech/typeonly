# @typeonly/reader

<!-- [![Build Status](https://travis-ci.com/tomko-team/typeonly-reader.svg?branch=master)](https://travis-ci.com/tomko-team/typeonly-reader)
[![Dependencies Status](https://david-dm.org/tomko-team/typeonly-reader/status.svg)](https://david-dm.org/tomko-team/typeonly-reader)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/795a3bf921524597bac9af7df8b79026)](https://www.codacy.com/manual/paleo/typeonly-reader?utm_source=github.com&utm_medium=referral&utm_content=tomko-team/typeonly-reader&utm_campaign=Badge_Grade) -->
[![Build Status](https://travis-ci.com/tomko-team/typeonly.svg?branch=master)](https://travis-ci.com/tomko-team/typeonly)
[![npm](https://img.shields.io/npm/dm/@typeonly/reader)](https://www.npmjs.com/package/@typeonly/reader)
![Type definitions](https://img.shields.io/npm/types/@typeonly/reader)
![GitHub](https://img.shields.io/github/license/tomko-team/typeonly)

[TypeOnly](https://github.com/tomko-team/typeonly/tree/master/typeonly) aims to be the pure typing part of TypeScript. The TypeOnly parser generates RTO files (with the `.rto.json` extension) that contain metadata extracted from `.d.ts` typing files. Then, this package provides an API to read these RTO files. It brings typing metadata at runtime.

## Tutorial: Load typing definitions at runtime

At first, it is necessary to follow [the tutorial](https://github.com/tomko-team/typeonly/blob/master/typeonly/README.md#tutorial-parse-typescript-definitions-with-the-cli) of TypeOnly in order to generate RTO files (with the `.rto.json` extension) from TypeScript definitions. After this step, the RTO files are in a `dist-types/` directory.

Now, add `@typeonly/reader` to the project:

```sh
npm install @typeonly/reader
```

Create a file `src/main.js` with the following content:

```ts
// src/main.js
const { readModules, literals } = require("@typeonly/reader");

const modules = readModules({
  bundle: require(`./types.to.json`)
});

const { ColorName } = modules["./drawing"].namedTypes;
console.log("Color names:", literals(ColorName, "string"));
```

If you write this code in a TypeScript source file, simply replace the `require` syntax with a standard `import`.

We can execute our program:

```sh
$ node src/main.js
Color names: [ 'red', 'green', 'blue' ]
```

Yes, it’s as easy as it seems: the list of color names is now available at runtime.

Notice: The TypeOnly parser is used at build time. At runtime, our code only use `@typeonly/reader` which is a lightweight wrapper for `.rto.json` files.

## Contribute

With VS Code, our recommanded plugin is:

- **TSLint** from Microsoft (`ms-vscode.vscode-typescript-tslint-plugin`)
