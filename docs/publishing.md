---
title: Publishing
summary: How to version and publish packages to npm.
read_when:
  - releasing a new version
  - updating package versions
---

# Publishing

The project uses [Changesets](https://github.com/changesets/changesets) for versioning. All packages are published with public access.

## Steps

```sh
# 1. Create a changeset describing the changes
npm run changeset

# 2. Apply version bumps from accumulated changesets
npm run changeset:version

# 3. Install to update lockfile with new versions
npm install

# 4. Build all packages
npm run build

# 5. Publish each package (in dependency order)
(cd packages/typeonly && npm publish)
(cd packages/loader && npm publish)
(cd packages/validator && npm publish)
(cd packages/validator-cli && npm publish)
```

## Dependency Updates

Changesets is configured to auto-update internal dependencies at patch level. When `typeonly` gets a patch bump, downstream packages (`loader`, `validator`, `validator-cli`) update their dependency range automatically.

## Pre-publish Check

Each package runs `prepublishOnly` before publishing, but not the same checks: `typeonly` runs lint, build and test; `loader` and `validator` run build and test; `validator-cli` runs build alone.
