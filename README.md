# TypeOnly

TypeOnly is a language to describe typing for JavaScript and JSON data. TypeOnly is a strict subset of TypeScript: any code that compiles with TypeOnly will also compile with TypeScript.

Applications built on top of this language:

* [**@typeonly/reader**](https://github.com/tomko-team/typeonly-reader): Brings typing metadata at run time;
* [**@typeonly/checker**](https://github.com/tomko-team/typeonly-checker): Checks data conformity, for example a JSON data.

## How to use the Command Line Interface

Compile a typing source file:

```sh
npx typeonly --source-dir src/ --output-dir dist-rto/ file-name.d.ts
```

This command generates a compiled file `dist-rto/file-name.rto.json`.

Available options:

```
  -h, --help                   Print this help message.
  -o, --output-dir directory   The output directory (optional).
  -s, --source-dir directory   The source directory (optional when is used with option --ast).
  -e, --encoding string        Encoding for input and output file(s) (default is utf8).
  --ast                        Generate AST files instead of RTO files (optional).
  --src file ...               The input file to process (by default at last position).
```

## How to use the API from Node.js

Install as a dependency:

```sh
npm install typeonly
```

Then, use it:

```js
const { generateRtoModules } = require("typeonly")

generateRtoModules({
  modulePaths: ["./file-name"],
  readFiles: {
    sourceDir: `${__dirname}/src`,
  },
  writeFiles: {
    outputDir: `${__dirname}/dist-rto`,
    prettify: 2
  }
}).catch(console.log)
```

## Known Limitations

There is some kind of source code that can currently be parsed without error with TypeOnly, although it is invalid in TypeScript. This is a temporary limitation of our implementation. Do not use it! TypeOnly will always remain a strict subset of TypeScript. If you write some code that is incompatible with TypeScript, then future versions of TypeOnly could break your code.

An example of invalid TypeScript code that mistakenly can be parsed by the current version of TypeOnly:

```ts
interface I1 {
  [name: string]: boolean
  p1: number // TS Error: Property 'p1' of type 'number' is not assignable to string index type 'boolean'.
}
```

## Contribute

### Install and Build

We need a JVM (Java Virtual Machine) to build the parser because we use [ANTLR](https://www.antlr.org/), which is a Java program. So, at first, install a JVM on your system.

In a terminal, open the cloned `typeonly/` repository. Then:

```sh
# Download once the ANTLR JAR file in the project's root directory
wget https://www.antlr.org/download/antlr-4.7.2-complete.jar

# Install once all Node.js dependencies
npm install
```

### Development environment

With VS Code, our recommanded plugins are:

- **ANTLR4 grammar syntax support** from Mike Lischke (`mike-lischke.vscode-antlr4`)
- **Todo Tree** from Gruntfuggly (`gruntfuggly.todo-tree`)
- **TSLint** from Microsoft (`ms-vscode.vscode-typescript-tslint-plugin`)
