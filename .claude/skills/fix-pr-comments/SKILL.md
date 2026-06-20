---
name: fix-pr-comments
description: Read review comments on a PR, apply the requested fixes on its branch, push them (one commit per fix, unless several comments are clearly about the same thing), then reply with a PR-scoped commit link on each resolved thread — attaching screenshots when the fix is visual. Use to action reviewer feedback on a PR end to end.
---

## What this does

Turns reviewer feedback on a PR into pushed commits + per-thread replies. Built for the PRs that **implement-ai-issues** opens, but works on any PR on this repo.

> Related: there is also a global **resolve-pr-comments** skill that walks threads one-by-one and asks for approval before each commit. This skill is the more autonomous variant: it batches the work, pushes, and posts a commit link reply (and screenshots for visual changes). Use that one when you want a careful, approval-gated pass; use this one to action feedback in bulk.

## Inputs

- **PR** — the PR number (or infer from the current branch via `gh pr view`).

## Step 1 — Pull the review threads

Fetch all review threads (resolved and unresolved) with their full comment history:
```bash
gh api graphql -f query='
{ repository(owner:"BooleT37", name:"finances") {
    pullRequest(number: <PR>) {
      headRefName
      reviewThreads(first: 100) { nodes {
        id isResolved isOutdated
        path line
        comments(first: 50) { nodes {
          databaseId author{login} body createdAt
          reactions(first: 20) { nodes { content user{login} } }
        } }
      } }
    } } }'
```

Also fetch top-level PR comments (not tied to a code line):
```bash
gh pr view <PR> --comments --json comments \
  --jq '.comments[] | {author: .author.login, body, createdAt}'
```

For the top-level comments, also fetch their database IDs so you can reply to them:
```bash
gh api repos/BooleT37/finances/issues/<PR>/comments \
  --jq '.[] | {id, user: .user.login, body, created_at}'
```

## Step 2 — Classify each thread

Work through every thread and every top-level comment. Classify each one before touching any code.

### Skip immediately (no action, no question)
- `isResolved: true` — already resolved, skip.
- `isOutdated: true` — diff context is gone, skip.

### Determine the comment author type

For each **inline thread**, look at the first comment's author login:
- If the author is `BooleT37` (the repo owner) → **human comment** — see human rules below.
- If the author posted from the `🤖 AI Review` review block (body starts with `> 🤖`) → **AI comment** — see AI rules below.

For **top-level PR comments** (from `gh pr view --comments`): apply human rules if author is `BooleT37`, AI rules if the body starts with `> 🤖`.

---

### Human comments → address automatically

Fix human-authored threads without any approval gate. The fix IS wanted.
Exceptions (skip without fixing):
- The author later said "nvm", "ignore", "not needed", or similar.
- The thread is a pure question with no implied change (reply with an answer, no commit).

---

### AI comments (🤖-prefixed) → check for explicit human signal

The AI comment represents a suggested finding. Only act on it if a **human has explicitly endorsed it**. Look at all follow-up comments and reactions on the thread from `BooleT37`:

**Positive signal → fix it:**
- A positive emoji reaction on the AI comment (👍, ❤️, 🚀, 🎉, +1)
- A follow-up comment saying "fix this", "yes", "agreed", "do it", or similar
- A follow-up comment that refines or clarifies how to fix it — treat those clarifications as authoritative and incorporate them into the fix

**Negative signal → skip it:**
- A negative emoji reaction (👎, 😕, -1)
- A follow-up comment saying "ignore", "not needed", "disagree", "skip", or similar

**No signal or ambiguous signal → STOP and ask the owner:**
- No reactions, no follow-up comments at all
- Mixed signals (👍 and 👎 both present)
- A comment that's unclear about intent

When asking the owner, quote the AI comment body and say exactly what signal is missing:
> "Thread on `<path>:<line>` has an AI finding but no clear human signal. The finding: «<body>». Fix it, skip it, or give me more direction?"

Do not proceed past an ambiguous AI thread without an answer. Address it before moving on.

---

## Step 3 — Group actionable threads into commits

- **Default: one commit per fix** (per thread).
- **Merge** multiple threads into one commit only when they are clearly the same underlying change (e.g. the same variable renamed on three lines, or two threads describing one bug). When in doubt, keep them separate.

Record the mapping **thread(s) → commit** so you can post the right link to each afterward.

## Step 4 — Get the branch (isolated)

If you're not already in a worktree for this branch, create one with the **create-worktree** skill using the PR's `headRefName` (the branch already exists, so it checks it out). Do all edits there.

## Step 5 — Apply each fix

For each commit-group, in order:
1. Make the change, following repo conventions (`CLAUDE.md`, feature docs, **bugfix**/**api-conventions** skills). For AI-comment fixes endorsed with clarifying instructions, follow those instructions over the original AI suggestion.
2. Get `npm run typecheck && npm run lint && npm run format:check` clean.
3. If the feature has tests and the fix changes behavior, update/add a case (**testing** skill) and run it.
4. If the change is **visual**, verify it in the browser via the **Playwright MCP** (dev server on `http://localhost:3002`) and capture an after-screenshot.
5. Commit with a [conventional commits](https://www.conventionalcommits.org/) message scoped to the feature. Keep it to this one fix-group.

## Step 6 — Push

Push all the new commits at once:
```bash
git push origin <branch>
```

Capture each **full 40-character SHA** to build PR-scoped commit links:
```
https://github.com/BooleT37/finances/pull/<PR>/changes/<full-sha>
```
Use this PR-scoped URL (not the repo-level `/commit/<sha>`) — it keeps reviewers in context on the PR page.

## Step 7 — Publish screenshots to the `pr-screenshots` branch (visual fixes only)

For any fix that changes something visual, push the after-screenshot to the **shared `pr-screenshots` orphan branch** under `pr-<PR>/`. Publish via a throwaway worktree so your branch checkout stays clean:
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

## Step 8 — Reply on each thread

### Inline threads (code line comments)

For every thread you fixed, post a **threaded reply** with the PR-scoped commit link:

```bash
gh api graphql -f query='
mutation($tid:ID!, $body:String!) {
  addPullRequestReviewThreadReply(input:{ pullRequestReviewThreadId:$tid, body:$body }) {
    comment { url }
  } }' -f tid="<thread id>" -f body="Fixed in <commit-url>"
```

Body format:
- non-visual: `> 🤖 Fixed in <commit-url>`
- visual: `> 🤖 Fixed in <commit-url>` + newline + `![after](<screenshot-url>)`

The `> 🤖` blockquote prefix marks the reply as AI-authored, distinguishing it from the repo owner's own comments.

If two threads share one commit, post the same link to each.

### Top-level PR comments

For top-level comments you acted on, reply by quoting the original comment and adding the commit link:

```bash
gh api -X POST repos/BooleT37/finances/issues/<PR>/comments \
  --field body="$(cat <<'EOF'
> <original comment body quoted here>

> 🤖 Fixed in <commit-url>
EOF
)"
```

Do **not** resolve threads automatically — leave that to the reviewer.

## Step 9 — Report

Summarize in four groups:
- **Fixed** — thread/comment → commit link
- **Skipped (resolved/outdated)** — count only
- **Skipped (negative signal or human said ignore)** — thread → reason
- **Waiting for owner input** — any AI threads where you stopped to ask
