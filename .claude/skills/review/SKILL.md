---
name: review
description: AI code review for a PR in this repo. Fetches the diff, checks it against CLAUDE.md conventions and feature docs, and posts findings as an inline GitHub review (all in one review block, tagged 🤖 so it's visually distinct from human comments). Invoke as /review <PR#>, or omit the number to review the current branch's PR.
---

## What this does

Fetches the PR diff, reads the relevant feature docs and CLAUDE.md conventions, spins up a review subagent, and posts findings as a single GitHub review — inline comments where possible, a summary in the review body. All AI comments are prefixed with `🤖` to distinguish them from human review comments. Uses `event: "COMMENT"` (never approve or request-changes).

## Input

- **PR** — PR number. If omitted, infer with `gh pr view --json number -q .number`.

## Step 1 — Gather context

```bash
# Resolve PR number if needed
PR=$(gh pr view --json number -q .number 2>/dev/null || echo "<arg>")

# PR metadata
gh pr view $PR --repo BooleT37/finances --json title,body,headRefName,baseRefName,additions,deletions,changedFiles

# Full diff (cap at 8000 lines — if longer, note it and review the most-changed files first)
gh pr diff $PR --repo BooleT37/finances

# List of changed files with patch hunks
gh api repos/BooleT37/finances/pulls/$PR/files --paginate \
  --jq '.[] | {filename, status, additions, deletions, patch}'
```

Identify which `src/features/<name>/` directories are touched. For each affected feature, read its feature doc:
```bash
cat src/features/<name>/<NAME>.md   # e.g. src/features/transactions/TRANSACTIONS.md
```

Also read the full `CLAUDE.md` from the repo root — this is the primary conventions source.

## Step 2 — Spawn the review subagent

Spawn a `general-purpose` subagent with this briefing (fill in the actual values):

```
You are doing a code review for PR #<PR> ("<title>") in the BooleT37/finances repo.

## Your job
Review the diff for:
1. **Correctness bugs** — logic errors, off-by-ones, missing null checks at boundaries, wrong sign/direction, race conditions.
2. **Convention violations** — check every item in CLAUDE.md's Notes section. Key ones:
   - dayjs everywhere; never native Date (except Prisma where clauses)
   - 0-based months (0-11) in atoms, API calls, DB fields
   - adaptCost / cost sign convention (negative for expenses, positive for income)
   - getOrThrow for entity map lookups — never optional chaining
   - mutate + onSuccess, not mutateAsync (unless chaining mutations)
   - No cross-feature internal imports — duplicate or move to ~/shared; categories/sources are shared infrastructure and are fine
   - No barrel index files
   - No unnecessary comments — code should be self-explanatory
   - CostList + HoverCard for hover transaction lists
   - Anchor component="button" for click-only links
   - react-hooks/exhaustive-deps must not be silenced
3. **Simplification** — dead code, redundant state, a built-in that does what custom code does.
4. **Type safety** — unnecessary non-null assertions (!), any casts that hide real problems.

## What NOT to flag
- Style preferences not in CLAUDE.md
- Things that are already fixed in the diff
- Nitpicks about naming when the name is clear enough
- Pure positives / praise — only flag real issues

## Diff and context
<paste the full diff here>

## CLAUDE.md conventions
<paste full CLAUDE.md content here>

## Feature docs for affected features
<paste each affected FEATURE.md here, labelled>

## Output format
Return a JSON block (and nothing else outside it) in this exact shape:

{
  "summary": "...",
  "comments": [
    {
      "path": "src/features/foo/Bar.tsx",
      "line": 42,
      "side": "RIGHT",
      "body": "**Bug:** explain the problem and suggest the fix."
    }
  ]
}

### `summary` field

Write the summary as structured Markdown, not a prose paragraph. Use this layout:

1. **One sentence** overall verdict (e.g. "Clean implementation with two convention violations and one correctness issue.")
2. A grouped list of findings, one group per category. Only include categories that have findings. Use the exact headings below and a bullet list under each:

### 🐛 Bugs
- `path:line` — short description

### ⚠️ Convention violations
- `path:line` — short description

### 🔧 Simplifications
- `path:line` — short description

### 🔒 Type safety
- `path:line` — short description

3. **Group related findings** that stem from the same root cause under a single bullet (e.g. three lines all using native `Date` → one bullet "native `Date` used in 3 places (lines 30, 36, 235) — should be `dayjs.Dayjs`"). The inline comments will still point to each individual line.
4. If no issues were found, write: "No issues found — the diff looks clean and follows all conventions."

### `comments` field

- `line` must be the **new** file line number (right side of the diff). Use the line where the problem is, not the hunk header.
- `side` is always "RIGHT" for new-file lines.
- `body` must start with one of: **Bug:**, **Convention:**, **Simplification:**, or **Type safety:** — followed by a clear description and ideally a concrete fix suggestion.
- Only include comments where you are confident there is a real issue. When in doubt, omit.
- Maximum 15 inline comments — prioritise by severity. If you have more, include the overflow in the summary.
- Do not wrap in markdown fences inside the JSON body fields.
```

Wait for the subagent to return the JSON block.

## Step 3 — Parse and post the review

Parse the subagent's JSON output. Then post a single review via the GitHub API:

```bash
gh api -X POST /repos/BooleT37/finances/pulls/$PR/reviews \
  --input - <<EOF
{
  "body": "## 🤖 AI Review\n\n<summary from subagent>\n\n---\n_Posted by Claude via `/review` skill. These are automated findings — use your judgement._",
  "event": "COMMENT",
  "comments": [
    <array of comment objects, each body prepended with "> 🤖 ">
  ]
}
EOF
```

Build the JSON payload carefully:
- Prepend `> 🤖 ` to each comment `body` so AI inline comments are visually distinct in the thread.
- If a `line` from the subagent doesn't appear in the diff (subagent hallucinated a line number), post it as a top-level note in the review body instead of dropping it silently.
- If `comments` is empty, still post the review with just the summary body.

The review body should be a **short triage list**, not the full subagent summary. From the subagent JSON, build a compact body:
- If no issues: one line — `No issues found.`
- If issues: one bullet per finding, format `- <emoji> \`path:line\` — <one-sentence description>`. Use 🐛 for bugs, ⚠️ for convention violations, 🔧 for simplifications, 🔒 for type safety. The detail lives in the inline comment; the body is just an index.

**Constructing the payload with jq** (safer than raw string interpolation):

```bash
# Write subagent output to a temp file first
cat > /tmp/review-output.json << 'ENDJSON'
<subagent JSON here>
ENDJSON

# Build compact body from inline comments list
COMPACT_BODY=$(jq -r '
  if (.comments | length) == 0 then "No issues found."
  else
    "Issues found:\n" +
    ([.comments[] | "- \(.path):\(.line) — \(.body | gsub("^\\*\\*[^:]+:\\*\\* "; "") | split("\n")[0] | .[0:120])"] | join("\n"))
  end
' /tmp/review-output.json)

# Build and post review
jq -n \
  --arg body "$COMPACT_BODY" \
  --argjson comments "$(jq '[.comments[] | .body = ("> 🤖 " + .body)]' /tmp/review-output.json)" \
  '{
    body: ("## 🤖 AI Review\n\n" + $body + "\n\n---\n_Posted by Claude via `/review` skill. Automated findings — use your judgement._"),
    event: "COMMENT",
    comments: $comments
  }' | gh api -X POST /repos/BooleT37/finances/pulls/$PR/reviews --input -
```

## Step 4 — Report

Print: the PR number reviewed, count of inline comments posted, and a link to the review on GitHub. If any line numbers were invalid and fell back to the summary, note that too.

## Notes

- **Never** post `event: "APPROVE"` or `event: "REQUEST_CHANGES"` — always `"COMMENT"`.
- **Never** post a review if the diff fetch fails or returns empty — report the error instead.
- If the diff is over 600 KB, summarise which files were skipped in the review body.
- The subagent must stay focused on the diff — don't have it read the entire codebase.
