---
title: Build System
summary: The Turbo task graph, and the per-package script pattern.
read_when:
  - a build or test runs something you did not expect
  - adding a script to a package, or a new package to the monorepo
  - a cached build serves a stale result
---

# Build System

## Turbo task graph

Defined in `turbo.json`:

- `build` depends on `clear` and on the upstream packages' `build`, caching `dist/**` and `antlr-parser/**`.
- `tsc` has the same dependencies, caching `dist/**` alone.
- `test` depends on `build`, and is never cached.
- `clear` and `lint` are never cached.

Because `build` depends on `clear`, a build always starts from an empty `dist/`. `npm run build:force` rebuilds everything, ignoring the Turbo cache.

## Per-package scripts

| Script | Description |
|---|---|
| `clear` | Remove `dist/` and `scripts/declarations/` |
| `tsc` | TypeScript compile |
| `build` | Clear + compile + bundle `.d.ts` |
| `test` | `vitest run` |
| `lint` | `biome check .` |

Two exceptions:

- The `typeonly` core package runs an ANTLR step before `tsc` to generate the parser from the `.g4` grammar files, and its `clear` also empties `antlr-parser/`.
- `@typeonly/validator-cli` has **no `test` script**, and its `build` stops after `tsc` — it bundles no `.d.ts`.
