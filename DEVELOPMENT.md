# Development

The everyday workflow of this repository. Run `npm run docmap` for the full documentation — `docs/build-system.md` details the Turbo task graph and the per-package scripts.

## Stack and layout

An npm-workspaces monorepo of TypeScript packages, built with Turbo: `packages/typeonly` (the parser, with an ANTLR grammar step), `packages/loader`, `packages/validator`, and `packages/validator-cli`. Test with Vitest, lint and format with Biome, release with Changesets.

## Workspaces

A workspace is a git worktree plus its setup: `.plans` and `.local` symlinked to the main worktree, `.vscode/settings.json` copied, then `npm install` and `npm run build`. This repository has no dev server, so the tooling runs portless: nothing to start, no `dev` script.

Run `npm run workspace -- --guide` to learn the full procedures.

## Conventions

- _Ticket ID_: numeric.
- _Branch naming_: `<type>/<ticket-id>` (e.g. `feat/12`), or `<type>/<slug>` when there is no ticket.
- _Commit messages_: conventional commits, e.g. `feat: add validator option`. Do not mention the ticket ID.
- _Default branch_: `master`.

## Everyday commands

| Command | Purpose |
|---------|---------|
| `npm run build` | Build all packages in dependency order (Turbo) |
| `npm test` | Run all tests (Turbo runs build first) |
| `npm run lint` / `npm run lint:fix` | Check / fix with Biome |
| `npm run docmap` | Browse the project documentation |
| `npm run workspace -- <command>` | Manage worktree workspaces (`--guide` for the procedures) |
| `npm run plans:sync` | Publish and retrieve the task plans (`.plans`) |
