---
name: add-issue
description: Create a new GitHub issue on BooleT37/finances from a task description — clarifies ambiguity, checks for duplicates (exits early if found), decides the "ai" label and other labels, and once the repo's project-board automation adds the issue to the project, fills in its workflow fields (Status, Size, Feature, Priority). Use when the user wants to file/add/create a task, bug, or issue for this repo.
---

## What this does

Turns a task description into a properly labeled GitHub issue on `BooleT37/finances`, added to project #1 with its workflow fields filled in — end to end, but never silently: it stops to ask when a description is unclear, and stops for good if a duplicate already exists.

## Preconditions

- `gh auth status` shows `repo` + `project` scopes for `BooleT37/finances`.
- Repo: `BooleT37/finances`. Project: owner `BooleT37`, number `1` (`💸 Finances website tasks`), project id `PVT_kwHOAKqR784BZ-vW`.

## Step 1 — Get the description

An issue description is required. If the user's request doesn't include one, ask for it before doing anything else.

## Step 2 — Ask if anything is unclear

Read the description like you're about to implement it. If it leaves open questions that would materially change the implementation or the acceptance criteria (ambiguous expected behavior, an unstated product/UX decision, missing repro for a bug, etc.), ask the user before proceeding — don't guess. If it's genuinely clear, don't ask just for the sake of it.

## Step 3 — Duplicate check

Search existing issues (open and closed — a closed dup is still a dup) for overlap:
```bash
gh issue list --repo BooleT37/finances --state all --search "<keywords from the description>" --json number,title,state,url,labels
```
Try a couple of keyword variants (feature name, symptom, UI element) if the first search is too narrow. Read the title/body of any close hits (`gh issue view <n> --repo BooleT37/finances`) rather than trusting title match alone.

If a duplicate exists: report it to the user (number, title, state, url) and **stop — do not create the issue**.

If not: continue.

## Step 4 — Decide the `ai` label

Check in this order, stop at the first that applies:

1. **Explicit in the description** — the user said this should (or shouldn't) be AI-implemented. Use that and skip the rest.
2. **Obviously trivial** — a tooltip, a copy/text change, moving a button, a color/spacing tweak, a single small visible UI adjustment with no logic change. → add `ai` automatically.
3. **Obviously non-trivial** — involves a migration, will clearly take ≥2 separate commits to implement, requires refactoring existing logic before the new behavior can be added, or touches auth/users/security. → do **not** add `ai`.
4. **Otherwise** — ask the user whether to add the `ai` label.

## Step 5 — Decide other labels

Pick from the repo's existing label set — don't invent new labels:
```bash
gh label list --repo BooleT37/finances
```
(`bug`, `documentation`, `enhancement`, `invalid`, `question`, `wontfix`, `tech`, `admin`, `migration-needed`.)

Apply the ones that clearly fit (typically one type label, e.g. `bug` vs `enhancement` vs `tech` vs `admin`; add `migration-needed` only if the issue explicitly depends on the finances-t3 migration being done). Don't over-label — when a label's fit is genuinely unclear, leave it off rather than guessing.

## Step 6 — Write the issue and create it

The issue body should be **concise** — what's wrong or wanted and why it matters, not how to build it. Do not include implementation details, file paths, or technical approach unless the user explicitly asked for those to be included.

```bash
gh issue create --repo BooleT37/finances \
  --title "<concise title>" \
  --body "<concise description>" \
  --label "<label1>,<label2>"
```
Capture the issue number and URL from the output.

## Step 7 — Wait for the project auto-add

The repo owner's project workflow automatically adds new issues to project #1. Poll for the item rather than assuming a fixed delay:
```bash
gh project item-list 1 --owner BooleT37 --format json --limit 200 \
  | jq -r --arg n "<issue-number>" '.items[] | select(.content.number == ($n|tonumber)) | .id'
```
Retry every few seconds (up to ~30s total). If it still hasn't appeared after that, tell the user the issue was created but wasn't auto-added, and stop — don't set fields on an item that doesn't exist.

## Step 8 — Fill in the workflow fields

Once you have the item id, set the single-select fields with `gh project item-edit`. Field and option ids for project #1 (re-fetch with `gh project field-list 1 --owner BooleT37 --format json` if any lookup below fails — the board may have changed):

| Field | Field id | Options (name → id) |
|---|---|---|
| Status | `PVTSSF_lAHOAKqR784BZ-vWzhU5hUk` | Not started `d4db4513`, In progress `523df1a9`, Awaits review `50fa0d42`, Won't do `f50d95ca`, Done `03b536d2` |
| Size | `PVTSSF_lAHOAKqR784BZ-vWzhU5hjY` | Bite-sized `baeb75f4`, Small `124f1f0e`, Medium `2853345f`, Large `389ff04d`, Splitting required `f6994d79` |
| Feature | `PVTSSF_lAHOAKqR784BZ-vWzhU51ZE` | Users `24c7df3d`, Projects `37815b4f`, Transactions `03e13983`, Budgeting `64309a4b`, Subscriptions `33818a03`, Savings Spendings `aec64046`, Statistics `b78dcfa3`, Settings `c60ea625` |
| Priority | `PVTSSF_lAHOAKqR784BZ-vWzhXFzs8` | Low `15b09c99`, Medium `0e72f4ad`, High `cdf4b830` |

```bash
gh project item-edit --project-id PVT_kwHOAKqR784BZ-vW --id "<item-id>" \
  --field-id PVTSSF_lAHOAKqR784BZ-vWzhU5hUk --single-select-option-id d4db4513   # Status: Not started
```
Repeat for Size, Feature, and Priority with the option id you pick.

How to pick each:
- **Status**: always `Not started` for a freshly filed issue.
- **Size**: mirror the triviality judgment from Step 4 — trivial UI tweaks are `Bite-sized`/`Small`; ordinary feature work is `Medium`; anything needing a migration or refactor-first is `Large`; if it looks like it should really be broken into multiple issues, use `Splitting required`.
- **Feature**: match the issue to the closest option based on which part of the app it touches (a Categories/Sources change generally falls under `Budgeting` or `Transactions` depending on where it surfaces; Project Users falls under `Users`/`Projects`). If genuinely unclear between two, ask.
- **Priority**: infer from the description if it signals urgency or a blocker (`High`), or explicitly says it's minor/nice-to-have (`Low`). Default to `Medium` when nothing suggests otherwise — don't ask just to pick between Medium and something else unless the description gives conflicting signals.

## Step 9 — Report back

Tell the user: the issue number/URL, whether a duplicate check turned up anything close (even if not an exact dup), the labels applied and why (especially the `ai` decision), and the field values set.

## Never

- Never create the issue if Step 3 finds a duplicate.
- Never add implementation details to the issue body unless the user explicitly asked for them.
- Never invent a label or a project field option that isn't in the lists above / `gh label list` — ask instead.
