---
name: fix-pr-comments
description: Read review comments on a PR, apply the requested fixes on its branch, push them (one commit per fix, unless several comments are clearly about the same thing), then reply "Fixed in <commit-link>" on each resolved thread — attaching screenshots when the fix is visual. Use to action reviewer feedback on a PR end to end.
---

## What this does

Turns reviewer feedback on a PR into pushed commits + per-thread replies. Built for the PRs that **implement-ai-issues** opens, but works on any PR on this repo.

> Related: there is also a global **resolve-pr-comments** skill that walks threads one-by-one and asks for approval before each commit. This skill is the more autonomous variant: it batches the work, pushes, and posts a "Fixed in …" reply with the commit link (and screenshots for visual changes). Use that one when you want a careful, approval-gated pass; use this one to action feedback in bulk.

## Inputs

- **PR** — the PR number (or infer from the current branch via `gh pr view`).

## Step 1 — Pull the review threads

Fetch unresolved review threads with their comments, file/line, and resolution state:
```bash
gh api graphql -f query='
{ repository(owner:"BooleT37", name:"finances") {
    pullRequest(number: <PR>) {
      headRefName
      reviewThreads(first: 100) { nodes {
        id isResolved isOutdated
        path line
        comments(first: 50) { nodes { author{login} body createdAt } }
      } }
    } } }'
```
Also read top-level review bodies (`gh pr view <PR> --comments`) for feedback not tied to a line.

## Step 2 — Decide what's actionable

For each thread, judge from the latest state whether a change is still wanted:
- skip threads already `isResolved`, or where the author later said "nvm"/👍/"looks good",
- skip pure questions you can answer with a reply but no code change (reply, don't commit),
- when it's genuinely unclear whether the reviewer still wants the change, **ask the owner** rather than guessing.

## Step 3 — Group comments into commits

- **Default: one commit per fix** (per thread).
- **Merge** multiple comments into one commit only when they're clearly the same underlying change (e.g. "rename this var" appearing on three lines, or two comments describing one bug). When in doubt, keep them separate.

Record the mapping **thread(s) → commit** so you can post the right commit link to each thread afterward.

## Step 4 — Get the branch (isolated)

If you're not already in a worktree for this branch, create one with the **create-worktree** skill using the PR's `headRefName` (the branch already exists, so it checks it out). Do all edits there.

## Step 5 — Apply each fix

For each commit-group, in order:
1. Make the change, following repo conventions (`CLAUDE.md`, feature docs, **bugfix**/**api-conventions** skills).
2. Get `npm run typecheck && npm run lint && npm run format:check` clean.
3. If the feature has tests and the fix changes behavior, update/add a case (**testing** skill) and run it.
4. If the change is **visual**, verify it in the browser via the **Playwright MCP** (dev server on `http://localhost:3002`) and capture an after-screenshot.
5. Commit with a [conventional commits](https://www.conventionalcommits.org/) message scoped to the feature. Keep it to this one fix-group.

## Step 6 — Push

Push all the new commits at once:
```bash
git push origin <branch>
```
Capture each commit SHA you created (`git log` / from the commit step) to build PR-scoped links:
`https://github.com/BooleT37/finances/pull/<PR>/commits/<full-sha>`.

Use the full 40-character SHA (not a short hash) and the PR-scoped URL — not the repo-level commit URL (`/commit/<sha>`). The PR-scoped link keeps reviewers in context on the PR page.

## Step 7 — Publish screenshots to the `pr-screenshots` branch (visual fixes only)

For any fix that changes something visual, push the after-screenshot to the **shared `pr-screenshots` orphan branch** (same branch every PR uses) under `pr-<PR>/`. Publish via a throwaway worktree so your branch checkout stays clean:
```bash
SUBDIR=pr-<PR>
git fetch origin
if git ls-remote --exit-code --heads origin pr-screenshots >/dev/null 2>&1; then
  git worktree add /tmp/pr-shots pr-screenshots
else
  git worktree add --detach /tmp/pr-shots
  ( cd /tmp/pr-shots && git checkout --orphan pr-screenshots && git rm -rf . >/dev/null 2>&1; \
    printf '# PR screenshots — do not merge\n' > README.md && git add README.md \
    && git commit -m "chore: init pr-screenshots" )
fi
mkdir -p /tmp/pr-shots/$SUBDIR
cp <png> /tmp/pr-shots/$SUBDIR/<thread-slug>.png      # one descriptive name per fix
( cd /tmp/pr-shots && git add "$SUBDIR" && git commit -m "shots: $SUBDIR" && git push origin pr-screenshots )
git worktree remove /tmp/pr-shots
```
Reference as `https://raw.githubusercontent.com/BooleT37/finances/pr-screenshots/pr-<PR>/<thread-slug>.png`. Use a distinct filename per fix so multiple visual fixes on the same PR don't overwrite each other.

## Step 8 — Reply "Fixed in …" on each thread

For every thread you addressed, post a **threaded reply** (not a new top-level comment) with the commit link, and embed the screenshot when the fix was visual.

Reply to a review thread via GraphQL:
```bash
gh api graphql -f query='
mutation($tid:ID!, $body:String!) {
  addPullRequestReviewThreadReply(input:{ pullRequestReviewThreadId:$tid, body:$body }) {
    comment { url }
  } }' -f tid="<thread id>" -f body="Fixed in <commit-url>"
```
(Or the REST equivalent: `POST /repos/BooleT37/finances/pulls/<PR>/comments/<comment_id>/replies`.)

Body format:
- non-visual: `Fixed in <commit-url>`
- visual: `Fixed in <commit-url>` + newline + `![after](https://raw.githubusercontent.com/BooleT37/finances/pr-screenshots/pr-<PR>/<thread-slug>.png)`

If two threads share one commit, post the same commit link to each.

Do **not** resolve the threads automatically — leave that to the reviewer (unless the owner asks otherwise).

## Step 9 — Report

Summarize: threads fixed (→ commit links), threads skipped (and why), threads where you replied without a code change, and any you flagged back to the owner as unclear.
