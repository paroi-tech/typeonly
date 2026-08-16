# Instructions for Agent - TypeOnly

Always ignore the `.local`, `.local-wt` and `.plans` directories when searching the codebase.

## Docmap - Seek Documentation

*Before* any investigation or code exploration, run `npm run docmap`, then read the relevant documentation. Mandatory for every task.

### Essential Documentation

Always read before any investigation or work:

- `docs/architecture.md` — the packages and how they fit together
- `docs/code-style.md` — the conventions every change must follow

## Workspaces

A **workspace** is a git worktree (with its branch) plus its own dev setup: symlinked shared directories and seeded config files. Workspaces are isolated, so you can work on several branches in parallel. This repository has no dev server, so the system runs portless: nothing to start, no `dev` script.

Run `npm run workspace -- --guide` for the full procedures.

## AlignFirst - Ticket ID, Commit Message, Default Branch

_Ticket ID:_ Format is numeric. Use the ticket ID if explicitly provided. Otherwise, deduce it from the current branch name (no confirmation needed). If the branch name is unavailable, get it via `git branch --show-current`. Only ask the user as a last resort.

_Commit message convention:_ conventional commits, e.g. `feat: add validator option`. Do not mention the ticket ID.

_Branch naming convention:_ `<type>/<ticket-id>` (e.g. `feat/12`), or `<type>/<slug>` when there is no ticket.

_Default branch:_ `master`

### Team Plans Repository

In the main worktree, `.plans` is a symlink into a clone of the team plans repository (folder `typeonly/`). Plans are shared with the team through that repository and are never committed in this one.

After every change in `.plans/`, synchronize the plans: `npm run plans:sync`.
