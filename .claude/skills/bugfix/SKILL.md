---
name: bugfix
description: Step-by-step process for implementing a quick bugfix in this codebase
---

## Process Overview

Follow these steps in order. **At any point, if something is unclear or there are meaningful alternatives, stop and ask — present options rather than making assumptions. Always err on the side of confirmation.**

---

## Step 1 — Understand and Confirm the Bug

Before touching any code, clearly state:

- What the current (broken) behavior is
- What the expected (correct) behavior should be
- Where in the code the fix will live

Ask the user to confirm this understanding before proceeding.

---

## Step 2 — Plan the Fix

Describe the intended code change concisely. If the fix requires any preparatory refactoring (e.g. extracting a function, renaming, restructuring), split that into a separate commit that comes first.

Present the commit sequence (using [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) format):

- Refactoring commits (if any) come first — they must not change behavior
- The fix commit comes after

Ask the user to approve the plan before starting.

---

## Step 3 — Implement

Implement commit by commit, in the agreed order. Before each commit, unless the user explicitly asks to commit now: stop and show the user a summary of the changes in the working directory. Wait for explicit approval before committing. Husky runs code checks (TypeScript, ESLint) before each commit — fix any issues before proceeding.

---

## Step 4 — Tests

Check whether there are existing automated tests covering the area being fixed.

**If tests exist:** add a test case that reproduces the bug (fails before the fix, passes after). Bundle it in the same commit as the business logic fix, not a separate one.

**If no tests exist:** ask the user whether to add a test and, if so, at which layer (E2E, component, or unit). Consult the [testing skill](./../testing/SKILL.md) for conventions.

If the port is busy, ask the user to unblock. Do not attempt to unblock yourself.

---

## Step 5 — Manual Verification

If no automated test was written, use the Playwright MCP server to verify the fix in a real browser:

- Reproduce the original bug scenario to confirm it no longer occurs
- Check that surrounding behavior is unaffected

Report what was tested and the result. If the port is busy, ask the user to unblock. Do not attempt to unblock yourself.

---

## Standing Rule: When in Doubt, Ask

If at any step you are uncertain about scope, approach, or implementation detail — stop and ask. Present 2–3 concrete options with tradeoffs. Do not silently pick one.
