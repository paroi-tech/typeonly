# @typeonly/loader

[![Build Status](https://travis-ci.com/paroi-tech/typeonly.svg?branch=master)](https://travis-ci.com/paroi-tech/typeonly)
[![npm](https://img.shields.io/npm/dm/@typeonly/loader)](https://www.npmjs.com/package/@typeonly/loader)
![Type definitions](https://img.shields.io/npm/types/@typeonly/loader)
![GitHub](https://img.shields.io/github/license/paroi-tech/typeonly)

[TypeOnly](https://github.com/paroi-tech/typeonly/tree/master/typeonly) aims to be the pure typing part of TypeScript. The TypeOnly parser generates a `.to.json` file, which is a bundle that contains metadata extracted from `.d.ts` typing files. Then, this package provides an API to read these RTO files. It brings typing metadata at runtime.

## Tutorial: Load typing definitions at runtime

At first, it is necessary to follow [the tutorial](https://github.com/paroi-tech/typeonly/blob/master/typeonly/README.md#tutorial-parse-typescript-definitions-with-the-cli) of TypeOnly in order to generate a `.to.json` file based on your TypeScript definitions. After this step, you have the following file: `dist/types.to.json`.

Now, add `@typeonly/loader` to the project:

```sh
npm install @typeonly/loader
```

Create a file `src/main.js` with the following content:

```ts
// src/main.js
import { readFileSync } from "node:fs"
import { loadModules, literals } from "@typeonly/loader";

const modules = loadModules({
  bundle: JSON.parse(readFileSync(`./types.to.json`));
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

Notice: The TypeOnly parser is used at build time. At runtime, our code only use `@typeonly/loader` which is a lightweight wrapper for `.to.json` files.

## Contribute

With VS Code, our recommanded plugin is:

- **Biome** from biomejs (biomejs.dev)
