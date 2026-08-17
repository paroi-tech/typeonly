---
title: Core Parser
summary: The typeonly package — parsing .d.ts files, ANTLR grammar, build pipeline, and modification guide.
read_when:
  - working on the parser
  - understanding how .d.ts files become RTO JSON
  - using the typeonly CLI or API
  - adding support for new TypeScript syntax
---

# Core Parser (`typeonly`)

Parses TypeScript `.d.ts` files and generates RTO (Runtime Type Object) JSON files. This is the foundation package that all others depend on.

## CLI Usage

```sh
# Generate a bundle from a directory of .d.ts files
npx typeonly --bundle dist/types.to.json --source-dir types/

# Generate individual .rto.json files
npx typeonly --source-dir types/ file1.d.ts file2.d.ts

# Generate AST JSON (for debugging)
npx typeonly --ast --source-dir types/ file.d.ts
```

Key options: `--source-dir` (`-s`), `--output-dir` (`-o`), `--bundle` (`-b`), `--encoding` (`-e`), `--prettify`, `--ast`.

## API

Three functions exported from `src/api.ts`:

```ts
import { parseTypeOnly, generateRtoModules, createStandaloneRtoModule } from "typeonly";
```

- **`parseTypeOnly({ source })`** — Parse a TypeOnly source string into an AST.
- **`generateRtoModules({ modulePaths, readFiles, writeFiles, returnRtoModules })`** — Parse `.d.ts` files from disk and produce RTO JSON (written to files, returned in memory, or both).
- **`createStandaloneRtoModule({ ast })`** — Convert a single AST into an RTO module without file I/O.

## Output Formats

- **`.rto.json`** — One RTO file per source `.d.ts` file.
- **`.to.json`** — A bundle containing all RTO modules as a single JSON object, keyed by module path.

## Directory Structure

```
packages/typeonly/
  TypeOnlyLexer.g4          # ANTLR lexer grammar
  TypeOnlyParser.g4         # ANTLR parser grammar
  antlr-parser/             # Generated JS (git-ignored)
  src/
    api.ts                  # Public API
    cli.ts                  # CLI entry point
    ast.d.ts                # AST type definitions (hand-written source)
    rto.d.ts                # RTO type definitions (hand-written source)
    parser/
      parse-typeonly.ts     # Wires ANTLR lexer/parser, invokes AstExtractor
      AstExtractor.ts       # ANTLR listener → builds TypeOnlyAst
      CommentGrabber.ts     # Extracts comments from token stream
      antlr4-defs.d.ts      # Type shims for ANTLR4 JS runtime
    rto-factory/
      RtoModuleFactory.ts   # Converts AST → RtoModule
      RtoProject.ts         # Multi-module RTO orchestration
      AstImportTool.ts      # Import tracking and resolution
      InlineImportScanner.ts # Discovers import() expressions in AST
      ProjectInputOutput.ts # File I/O for source reading and .rto.json writing
      internal-types.d.ts   # Internal type definitions
    helpers/
      module-path-helpers.ts # Module path resolution utilities
      fs-utils.ts           # File system helpers
      js-lib.ts             # Small JS utilities (e.g., assertExists)
```

## Build Pipeline

```bash
npm run build
# Runs: clear → antlr → tsc → bundle-tsd
```

1. **`clear`** — Deletes `dist/`, `scripts/declarations/`, and `antlr-parser/`
2. **`antlr`** — Runs ANTLR4 Java tool to regenerate `antlr-parser/*.js` from grammar files
3. **`tsc`** — Compiles TypeScript to `dist/`
4. **`bundle-tsd`** — Runs `scripts/bundle-tsd.js` to merge `api.d.ts` + `rto.d.ts` + `ast.d.ts` into a single `dist/typeonly.d.ts`

### Prerequisites

A **JVM** must be installed. The ANTLR JAR must be downloaded once into `packages/typeonly/`, where the `antlr` script resolves it:

```bash
# From the monorepo root
wget https://www.antlr.org/download/antlr-4.13.2-complete.jar --directory-prefix packages/typeonly
```

## Common Modification Scenarios

### Adding Support for a New TypeScript Syntax Feature

Touch multiple layers:

1. **Grammar** — Modify `TypeOnlyParser.g4` (and possibly `TypeOnlyLexer.g4`).
2. **AST types** — Add new types/interfaces to `src/ast.d.ts`.
3. **AstExtractor** — Add `enter*`/`exit*` listener methods in `AstExtractor.ts`.
4. **RTO types** — Add corresponding types to `src/rto.d.ts`.
5. **RtoModuleFactory** — Add conversion logic and register in the `rtoTypeCreators` dispatch map.
6. **Tests** — Add AST tests in `tests/ast-tests/` and RTO tests in `tests/rto-tests/`.
7. **Rebuild** — Run `npm run build` (ANTLR step regenerates the parser).

### Modifying AST-Only Behavior (No Grammar Change)

1. Modify `AstExtractor.ts` listener methods.
2. Update types in `ast.d.ts` if the shape changes.
3. Rebuild and run tests.

### Modifying RTO Generation

1. Update `RtoModuleFactory.ts`.
2. Update types in `rto.d.ts` if the shape changes.
3. Rebuild and run tests.

## Key Implementation Details

### AstExtractor — ANTLR Listener Pattern

`AstExtractor` extends the generated `TypeOnlyParserListener`. It uses:

- **`childTypes` map** — Deferred type resolution. A parent node registers a setter, and the child `exit*` method calls it.
- **`compositeMap`** — Tracks union/intersection type composition across nested contexts.
- **`interfaceStack`** — Handles nested interface definitions.

### RtoModuleFactory — Dispatch Map Pattern

Uses a dispatch map keyed by `whichType` to convert AST types to RTO types:

```typescript
private rtoTypeCreators: {
  [K in Exclude<AstType, string>["whichType"]]: (astNode: any) => RtoType;
} = {
  array: (astNode) => this.createRtoArrayType(astNode),
  literal: (astNode) => this.createRtoLiteralType(astNode),
  composite: (astNode) => this.createRtoCompositeType(astNode),
  // ...
};
```

When adding a new AST type, you must add a corresponding entry here.

### Type Name Resolution

Simple type names (strings in the AST) are resolved into `RtoTypeName` objects with a `group`:

- `"ts"` — TypeScript special types: `any`, `unknown`, `object`, `void`, `never`
- `"primitive"` — Primitive types: `string`, `number`, `bigint`, `boolean`, `symbol`, `undefined`, `null`
- `"global"` — Global types: `String`, `Number`, `Boolean`, `Date`, `Symbol`, `Bigint`

Anything else becomes a `localRef` or `importedRef`.
