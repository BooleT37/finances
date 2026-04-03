---
name: feature-implementation
description: Step-by-step process for implementing a new feature in this codebase
---

## Process Overview

Follow these steps in order. **At any point, if something is unclear or there are meaningful alternatives, stop and ask — present options rather than making assumptions. Always err on the side of confirmation.**

---

## Step 1 — Definition of Done

Before writing any code, produce a written description of what will be built. This is the source of truth for all subsequent steps.

The document should cover:

- What the feature does from the user's perspective
- All UI states and interactions (empty state, loading, error, success)
- Edge cases and validation rules
- What is explicitly out of scope

Ask the user to review and confirm before moving on. Do not proceed to planning until the DoD is agreed upon.

---

## Step 2 — Implementation Plan

Break the work into a sequence of atomic commits, each addressing a single concern. Use [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) format.

Present the plan as an ordered commits list, with a description what you want to do in each commit, code-wise

- Each commit should be reviewable in isolation
- Migrations and schema changes come before API changes; API before UI
- Tests come last, after the feature is working

Ask the user to approve the plan before starting implementation.

---

## Step 3 — Implementation

Implement the plan commit by commit, in order. Commit only the files relevant to that step. Before every commit: stop and show the user a summary of the changes in the working directory. Wait for explicit approval before committing. Husky runs code checks like typescript and eslint before each commit, make sure to fix the issues before proceeding further.

Do not batch unrelated changes into a single commit. If you discover mid-implementation that the plan needs to change, pause and discuss with the user before continuing.

---

## Step 4 — Manual Verification

Once implementation is complete, use the Playwright MCP server to open the app in a real browser and verify the feature works end-to-end:

- Navigate to the relevant page
- Exercise the happy path
- Exercise key edge cases identified in the DoD

Report what was tested and whether it passed. If anything looks wrong, fix it before proceeding to tests.

---

## Step 5 — Automated Tests

Write tests to cover the feature. Consult the [testing skill](./../testing/SKILL.md) for conventions.

Decide on the right layer(s):

- **E2E (Playwright)** — for user-facing flows through the real UI
- **Component (React Testing Library)** — for components with non-trivial branching logic
- **Unit** — for pure utility functions

If unsure which layer is appropriate for a given case, ask.

---

## Standing Rule: When in Doubt, Ask

If at any step you are uncertain about scope, approach, or implementation detail — stop and ask. Present 2–3 concrete options with tradeoffs. Do not silently pick one. The cost of a wrong assumption compounds across all subsequent steps.
