# @typeonly/checker

Checks data conformity to [TypeOnly](https://github.com/tomko-team/typeonly) definitions, for example a JSON data.


## How to use the API (Node.js)

Install as a dependency:

```sh
npm install @typeonly/checker
```

Then, use it:

```js
const { createChecker } = require("@typeonly/checker")

async function f() {
  const checker = await createChecker({
    readModules: {
      modulePaths: ["./file-name"],
      baseDir: `${__dirname}/src`
    }
  })

  const result = checker.check("./file-name", "TypeName", data)
}
```

## Known Limitations

Generics are not implemented yet.

## Contribute

### Development environment

With VS Code, our recommanded plugins are:

- **ANTLR4 grammar syntax support** from Mike Lischke (`mike-lischke.vscode-antlr4`)
- **Todo Tree** from Gruntfuggly (`gruntfuggly.todo-tree`)
- **TSLint** from Microsoft (`ms-vscode.vscode-typescript-tslint-plugin`)
