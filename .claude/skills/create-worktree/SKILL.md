---
name: create-worktree
description: Create a ready-to-run git worktree for a feature/fix branch — copies local config (.agents, .claude, .codex, .env) from the main checkout and installs dependencies, so the app and the test suite run immediately. Use before implementing an issue or applying PR feedback in isolation.
---

## Purpose

Spin up an **isolated working copy** of this repo on a new branch, fully set up so `npm run dev` and `npm test` work right away. A plain `git worktree add` is not enough here: the dev server and Playwright tests need gitignored config files (`.env*`) and an installed `node_modules`, neither of which a bare worktree gets.

Prefer this skill over the Agent tool's built-in `isolation: "worktree"` when the work needs the running app, the database, or the E2E suite — those need the copied env + installed deps this skill provides.

## Inputs

- **branch** — the branch to create, e.g. `ai/139-horizontal-scroll`. Convention: `ai/<issue#>-<short-slug>`.
- **base** — base branch to fork from. Default `main`.

## Steps

1. **Sanity-check the repo state.** From the main checkout, confirm `git status` is clean enough to fork (uncommitted changes stay in the main checkout and won't follow the worktree — that's fine, just don't rely on them). Run `git fetch origin`.

2. **Compute the worktree path.** Use a sibling directory so worktrees never nest inside the repo:
   ```
   ../finances-worktrees/<branch-with-slashes-replaced-by-dashes>
   ```
   e.g. branch `ai/139-horizontal-scroll` → `../finances-worktrees/ai-139-horizontal-scroll`.

3. **Create the worktree off the freshest base:**
   ```bash
   git worktree add -b <branch> ../finances-worktrees/<dir> origin/<base>
   ```
   If the branch already exists (e.g. resuming PR feedback), drop `-b` and check it out instead:
   ```bash
   git worktree add ../finances-worktrees/<dir> <branch>
   ```

4. **Copy local config** from the main checkout root into the worktree root. Copy the full contents of `.agents`, `.claude`, `.codex`, and `.env` (whatever exists — some are directories, `.env` is a file). These hold agent/tooling config and secrets the worktree needs but that aren't fully tracked:
   ```bash
   # from the repo root
   for item in .agents .claude .codex .env; do
     [ -e "$item" ] && cp -R "$item" ../finances-worktrees/<dir>/
   done
   ```
   `cp -R` over the git-tracked `.claude` is harmless — it just overlays any local-only files (e.g. `settings.local.json`). **`.env` is required** — `prisma generate` (step 5) reads `DATABASE_URL` from it and fails without it. Do **not** copy `node_modules` — install fresh in the next step.

5. **Install dependencies and generate Prisma client** in the worktree:
   ```bash
   npm ci --prefix ../finances-worktrees/<dir>
   npm run db:generate --prefix ../finances-worktrees/<dir>
   ```
   (`npm ci` is correct here — the worktree starts with no `node_modules` and we want the lockfile-exact tree. `db:generate` runs `prisma generate` to produce the typed client and enums under `src/generated/prisma/`; without it the dev server and typecheck fail immediately.)

6. **Confirm it builds.** Run a fast check from inside the worktree:
   ```bash
   npm run typecheck --prefix ../finances-worktrees/<dir>
   ```
   If typecheck fails on a clean fork, stop and report — the base branch is broken, not your work.

7. **Report** the absolute worktree path and the branch name so the caller can `cd` into it.

## Notes & gotchas

- **Database is shared.** Dev and tests use the local Postgres (`finances` on host port 5434 — `docker start finances`). All worktrees hit the same DB. The E2E suite resets data, so run only one worktree's tests at a time.
- **Ports.** Dev server runs on **3002**, Playwright's webServer on **3001**. Don't run two dev servers (two worktrees) at once or they'll collide — this is why the parent workflow is sequential.
- **Cleanup** when the branch is merged or abandoned:
  ```bash
  git worktree remove ../finances-worktrees/<dir>
  ```
  Use `--force` only if you intentionally discard uncommitted changes. Run `git worktree prune` if a directory was deleted manually.
