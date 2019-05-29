# TypeOnly - `@paleo/typeonly`
Parse TypeOnly code.

## How to use the Command Line Interface

Example:

```sh
node dist/cli.js --src file.d.ts
```
This command will generate one file `file.ast.json`

Available options:
```
-h, --help                   Print this help message.
  -o, --output-dir directory   The output directory (optional).
  -e, --encoding string        Encoding for input and output file(s) (default is utf8).
  -f, --force                  Overwrite output files.
  --src file ...               The input file to process (by default at last position).
```

## Contribute

### Install and build

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
