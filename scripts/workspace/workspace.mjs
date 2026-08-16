// Workspace lifecycle wrapper. This monorepo has no dev server, so the system
// runs portless: no ports are allocated, and there is no `dev` script.

import { execFileSync, execSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runWorkspace } from "@paleo/workspace";

await runWorkspace({
  workspaceScript: fileURLToPath(import.meta.url),

  sharedDirs: [".local", ".plans"],
  runtimeDir: ".local-wt",

  gitignoredFiles: [
    { path: ".vscode/settings.json", source: { kind: "mainWorktree" }, optional: true },
  ],

  preSetup: ({ isMainWorktree, currentWorktree, force, log }) => {
    if (!isMainWorktree) return;
    // `.plans` must be usable
    execFileSync("npx", ["--no", "plans-share", "check"], {
      cwd: currentWorktree,
      stdio: "inherit",
    });
    const target = join(currentWorktree, ".vscode/settings.json");
    if (existsSync(target) && !force) return;
    copyFileSync(join(currentWorktree, ".vscode/settings.example.json"), target);
    log("Bootstrapped .vscode/settings.json from .vscode/settings.example.json.");
  },

  finalizeWorkspace: ({ currentWorktree, progress }) => {
    progress("npm install");
    execSync("npm install", { stdio: "inherit", cwd: currentWorktree });
    progress("npm run build");
    execSync("npm run build", { stdio: "inherit", cwd: currentWorktree });
  },

  formatSummary: ({ name, branch, currentWorktree, isMainWorktree, status }) => `
Workspace ${name} — ${status}
  Type:   ${isMainWorktree ? "main" : "linked"}
  Branch: ${branch}
  Path:   ${currentWorktree}
`,
});
