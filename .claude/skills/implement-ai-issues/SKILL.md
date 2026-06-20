---
name: implement-ai-issues
description: Autonomously implement GitHub issues labeled "ai". Pulls open "ai"-labeled issues from the project, and for each one that is unambiguous, implements it in its own worktree branch via a subagent, verifies it, adds tests when the feature already has them, verifies in a real browser via the Playwright MCP with screenshots, and opens a DRAFT PR with the screenshots attached. Ambiguous issues get a clarifying comment and are skipped. Processes issues sequentially.
---

## What this does

Walks the backlog of `ai`-labeled issues and turns the clear ones into draft PRs, end to end, without supervision. Each issue is handled in isolation (its own worktree + branch + subagent) so failures don't cross-contaminate.

**Operating decisions baked in (agreed with the repo owner):**
- **Sequential** — one issue at a time. Never run two implementation subagents (or two dev servers) at once; the dev/test ports (3002 / 3001) and the shared Postgres collide otherwise.
- **Open PRs** — every PR is opened in the standard open state (not draft). The owner reviews before merging.
- **Ambiguous → comment, don't guess** — if an issue lacks enough detail to implement safely, post a comment on the issue with the specific open questions and skip it.
- **Screenshots via the `pr-screenshots` branch** — host verification screenshots on one shared orphan branch and embed them by raw URL (see "Screenshots" below).

## Preconditions

1. `gh auth status` shows `repo` + `project` scopes.
2. Local Postgres is up: `docker start finances` (the `finances` DB on host port 5434).
3. The main checkout is on `main`, clean.
4. The `ai` label exists (`gh label list | grep '^ai'`).

## Step 1 — Gather the work

List open issues labeled `ai`:
```bash
gh issue list --repo BooleT37/finances --state open --label ai \
  --json number,title,body,labels,url
```
For each, also read existing discussion (`gh issue view <n> --comments`) — a maintainer may have added the missing context that resolves ambiguity. Record the **Feature** (page) of each issue from the project board (group-by Feature, or `gh project item-list`); you need it to find where the code lives and whether that feature has tests.

Process the issues **one at a time**, in ascending issue-number order.

## Step 2 — Ambiguity gate

Before any code, decide if the issue is implementable. It is **ambiguous** if any of these hold:
- the expected behavior isn't clear (a bug with no repro and non-obvious "correct" result),
- there are multiple plausible interpretations that would lead to materially different implementations,
- it needs a product decision (copy, thresholds, which screen, new UX) that isn't stated.

If ambiguous: post a comment on the issue listing the **specific** questions, e.g.
```bash
gh issue comment <n> --repo BooleT37/finances --body "$(cat <<'EOF'
Picked this up for autonomous implementation but it's ambiguous. To proceed I need:
- <question 1>
- <question 2>
Skipping for now — re-run once clarified.
EOF
)"
```
Then **skip** to the next issue. Do not implement.

## Step 3 — Set up an isolated worktree

For a clear issue, use the **create-worktree** skill with branch `ai/<issue#>-<short-slug>` (base `main`). That gives you a worktree with `.agents/.claude/.codex/.env` copied and deps installed. All remaining steps for this issue run **inside that worktree path**.

## Step 4 — Implement (via subagent)

Spawn **one** implementation subagent (Agent tool, `subagent_type: general-purpose`) pointed at the worktree. Give it:
- the full issue text + any clarifying comments + the acceptance criteria you distilled,
- the Feature/page and the relevant `src/features/<name>/` folder,
- an instruction to follow the repo conventions: read `CLAUDE.md`, the relevant `src/features/<name>/<FEATURE>.md`, and the **bugfix** / **feature-implementation** / **api-conventions** skills, and to honor the project rules (dayjs, 0-based months, cost-sign convention, `getOrThrow`, no barrel files, no silenced `react-hooks/exhaustive-deps`, comment-sparingly).

The subagent must, before returning:
- get `npm run typecheck && npm run lint && npm run format:check` clean (auto-fix with `npm run lint:fix && npm run format`).

Keep the change **atomic** and the commit message in [conventional commits](https://www.conventionalcommits.org/) form, scoped to the feature (e.g. `fix(transactions): …`).

## Step 5 — Tests (only if the feature already has them)

Check whether the feature this issue belongs to **already** has tests:
- E2E in `test/e2e/` (search for the feature's flows),
- component/unit tests colocated with the feature.

If it does, add case(s) covering this change, following the **testing** skill (fixed test date via `getToday()`, Mantine interaction patterns, import from `./fixtures`). Then run them:
```bash
npm test            # E2E (auto-starts dev server on 3001)
# or the targeted unit/component runner for a quick loop
```
If the feature has **no** tests at all, do **not** introduce a brand-new test layer for it — note that in the PR body instead.

## Step 6 — Verify in a real browser (Playwright MCP) + screenshots

Start the worktree dev server and drive it with the **Playwright MCP**:
```bash
npm run dev --prefix ../finances-worktrees/<dir>   # serves on http://localhost:3002
```
- `browser_navigate` to `http://localhost:3002`, reproduce the original problem path, and confirm the new behavior.
- Capture screenshots with `browser_take_screenshot` — for a visual change, take **before** (on `main`, if feasible) and **after**; for a behavioral fix, capture the key end state.
- Stop the dev server when done (don't leave it running into the next issue).

## Step 7 — Publish screenshots to the `pr-screenshots` branch

All screenshots for every PR live on **one shared orphan branch, `pr-screenshots`**. It never merges into `main` and is in no PR diff; `raw.githubusercontent.com` serves the files as real images, so they render inline in PRs and comments reliably.

Publish via a throwaway worktree so your working tree stays untouched. Put this issue's shots under `issue-<n>/`:
```bash
SUBDIR=issue-<n>
git fetch origin
if git ls-remote --exit-code --heads origin pr-screenshots >/dev/null 2>&1; then
  git worktree add /tmp/pr-shots pr-screenshots
else
  # first ever run — create the orphan branch
  git worktree add --detach /tmp/pr-shots
  ( cd /tmp/pr-shots && git checkout --orphan pr-screenshots && git rm -rf . >/dev/null 2>&1; \
    printf '# PR screenshots — do not merge\n' > README.md && git add README.md \
    && git commit -m "chore: init pr-screenshots" )
fi
mkdir -p /tmp/pr-shots/$SUBDIR
cp <your-pngs> /tmp/pr-shots/$SUBDIR/        # e.g. before.png after.png
( cd /tmp/pr-shots && git add "$SUBDIR" && git commit -m "shots: $SUBDIR" && git push origin pr-screenshots )
git worktree remove /tmp/pr-shots
```
Reference each image as:
`https://raw.githubusercontent.com/BooleT37/finances/pr-screenshots/issue-<n>/<file>.png`
Use stable, descriptive filenames (`before.png`, `after.png`). If you ever re-run for the same issue, suffix filenames so you don't overwrite shots already linked from an earlier PR/comment.

## Step 8 — Open a DRAFT PR

Push the branch and open a PR:
```bash
gh pr create --repo BooleT37/finances \
  --base main --head <branch> \
  --title "<type>(<feature>): <concise summary>" \
  --body "$(cat <<'EOF'
Closes #<issue>

## What
<what changed and why>

## Verification
- typecheck / lint / format: pass
- tests: <added X / feature has no tests>
- Playwright MCP: <flow exercised>

## Screenshots
![after](https://raw.githubusercontent.com/BooleT37/finances/pr-screenshots/issue-<issue>/after.png)
EOF
)"
```
Append the standard footer the repo uses for AI-authored PRs.

## Step 9 — Run the code review skill

Once the PR is open, run the **review** skill on it passing the PR number. This posts an automated 🤖 review with inline comments directly to the PR so the owner can triage findings before merging.

The review skill needs the PR diff to be available on GitHub, so run it after the push in Step 8 completes (no extra delay needed — the API is available immediately after `gh pr create` returns).

## Step 10 — Clean up & report

- Remove the worktree (`git worktree remove ../finances-worktrees/<dir>`) — the branch is safe on the remote, and the **fix-pr-comments** skill recreates a worktree if review feedback comes in.
- Move to the next issue.

When the run finishes, print a summary:
- **PRs opened** (issue → PR link → review link),
- **Skipped as ambiguous** (issue → the comment you posted),
- **Failed** (issue → what blocked it, worktree left in place for inspection).

## Never

- Never push to `main` directly.
- Never mark a PR ready, merge, or close an issue — the owner does that after review.
- Never run two issues concurrently.
