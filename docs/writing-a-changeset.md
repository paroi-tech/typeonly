---
title: Writing a Changeset
summary: How to author a Changesets file — identify packages, pick the bump, write the entry.
read_when:
  - writing a changeset
  - versioning a package change
---

# Writing a Changeset

Write the file directly. `npm run changeset` is the interactive equivalent, for humans.

1. **Identify modified packages.** Map changed file paths to their workspace packages: `packages/typeonly/` → `typeonly`, `packages/loader/` → `@typeonly/loader`, `packages/validator/` → `@typeonly/validator`, `packages/validator-cli/` → `@typeonly/validator-cli`. Only include packages with actual source changes — ignore generated files such as the ANTLR parser output.

   ```sh
   git diff master --name-only
   git status --short        # include uncommitted files
   ```

2. **Gather context from the plan directory.** Use the `alignfirst` skill to find the plan directory (`.plans/<ticketId>/`). Read the summary files (`*-summary.md`) and spec files to write a meaningful description.

3. **Determine the bump type** for each package:
   - `patch` — bug fixes, refactors, internal changes
   - `minor` — new features, new API surface
   - `major` — breaking changes

4. **Write the changeset file** in `.changeset/`, with a short kebab-case name (e.g. `.changeset/validator-generic-types.md`):

   ```markdown
   ---
   "@typeonly/validator": minor
   ---

   One-line summary of the change (past tense).
   ```

The packages depend on each other, and Changesets bumps an internal dependency at `patch` on its own — declare only the packages you actually modified.
