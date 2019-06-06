# @typeonly/checker

Checks data conformity to [TypeOnly](https://github.com/tomko-team/typeonly) definitions, for example a JSON data.

## How to use the Command Line Interface

Check JSON data file:

```sh
npx @typeonly/checker -m src/file-name.rto.json dir/data.json -t root-type-name
```

This return positive message if data is conform and error if not.

Available options:

```
  -h, --help                 Print this help message.
  -s, --base-dir directory   The source directory (optional).
  -m, --module file-name     The module '.rto.json' file relative to the base directory.
  -t, --type string          The type name of the root element in JSON.
  -e, --encoding string      Encoding for input file (default is utf8).
  --input file ...           The JSON file to check (by default at last position, One input file allowed).
```

## How to use the API (Node.js)

Install as a dependency:

```sh
npm install @typeonly/checker
```

Then, use it:

```js
```

## Known Limitations

Generics are not implemented yet.

## Contribute

### Development environment

With VS Code, our recommanded plugins are:

- **ANTLR4 grammar syntax support** from Mike Lischke (`mike-lischke.vscode-antlr4`)
- **Todo Tree** from Gruntfuggly (`gruntfuggly.todo-tree`)
- **TSLint** from Microsoft (`ms-vscode.vscode-typescript-tslint-plugin`)
