# @typeonly/checker-cli

A CLI to check JSON files conformity with [TypeOnly](https://github.com/tomko-team/typeonly) typing.

## How to use the Command Line Interface

Check JSON data file:

```sh
npx @typeonly/checker-cli -s src/file-name.d.ts -t RootTypeName data.json
```

This prints a confirmation message if data is conform or an error if not.

Available options:

```
  -h, --help                       Print this help message.
  -s, --source file.d.ts ...       The typing file (one file allowed).
  --source-encoding string         Encoding for typing files (default is utf8).
  --source-dir directory           The source directory that contains typing files (optional).
  --rto-module file.rto.json ...   The rto.json file to process (one file allowed).
  --rto-dir directory              The source directory for rto.json file (optional).
  -t, --type string                The type name of the root element in JSON.
  -e, --json-encoding string       Encoding for JSON file to check (default is utf8).
  --json file.json ...             The JSON file to check (by default at last position, one file allowed).
```

## Known Limitations

Generics are not implemented yet.

## Contribute

### Development environment

With VS Code, our recommanded plugins are:

- **ANTLR4 grammar syntax support** from Mike Lischke (`mike-lischke.vscode-antlr4`)
- **Todo Tree** from Gruntfuggly (`gruntfuggly.todo-tree`)
- **TSLint** from Microsoft (`ms-vscode.vscode-typescript-tslint-plugin`)
