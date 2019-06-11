# @typeonly/reader

Brings [TypeOnly](https://github.com/tomko-team/typeonly) metadata at run time.

## How to use the API (Node.js)

Install as a dependency:

```sh
npm install @typeonly/reader
```

Then, use it:

```js
const { readModules } = require("@typeonly/reader")

async function main() {
  const modules = await readModules({
    modulePaths: ["./file-name"],
    baseDir: `${__dirname}/dist-rto`
  })

  console.log(modules["./file-name"].namedTypes["T1"].refName)
}

main().catch(console.log)
```

## Known Limitations

Generics are not implemented yet.

## Contribute

### Development environment

With VS Code, our recommanded plugins are:

- **ANTLR4 grammar syntax support** from Mike Lischke (`mike-lischke.vscode-antlr4`)
- **Todo Tree** from Gruntfuggly (`gruntfuggly.todo-tree`)
- **TSLint** from Microsoft (`ms-vscode.vscode-typescript-tslint-plugin`)
