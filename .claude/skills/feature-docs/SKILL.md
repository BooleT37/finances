---
name: feature-docs
description: How to write feature documentation in this repo's house style. Must always be used when creating, updating or rewording any `src/features/{feature}/{FEATURE}.md` file (TRANSACTIONS.md, IMPORT.md, BUDGETING.md, CATEGORIES.md, SOURCES.md, SUBSCRIPTIONS.md, SAVING_SPENDINGS.md, PROJECT_USERS.md, PROJECT.md and any new one), even for a one-line change made as part of a bigger feature or bugfix.
---

# Feature Docs

Feature docs have a distinct house style that the user writes in by hand. Match it. This is explicitly _not_ the register for code comments, commit messages or chat replies, and it doesn't apply to `CLAUDE.md` or to internal planning notes.

## What a doc may contain

**Describe general UI patterns, never a specific screen.** Docs hold the business logic and the intent (reasonings) behind it as well as general UI patterns helping to reinforce it throughout the app. The main user flows can be mentioned too, instead of the screens they happen on: "shown during the planning flow", not "shown on the forecasts page". How one specific screen looks right now doesn't belong, since it can change at any time: a particular modal, button, hint or tooltip, what it says, where it sits, what gets preselected or hidden there. "There's a hint saying that the suggestions are disabled and an admin can enable them" goes. Say what the rule is, in terms of the domain: "deselected by default in the table" becomes what happens to the row, "pre-fills it in the import modal" becomes "suggests a category". If a sentence would stop being true after a redesign of that one screen that keeps the rules the same, it doesn't belong.

**Never mention the current production database state.** It can change, so a doc can't keep up with it. Describe how the database is designed and what's supported, e.g. "the field is optional" instead of "old rows were backfilled and some stayed empty".

**Never keep a history of changes.** When the business logic changes, rewrite the doc so it reads as if the logic had always been this way. No "changed on 01.10.2026: no longer does XXX" or similar nonsense. A previous state or a problem we hit can be mentioned only when it is the reason something exists, and then only as that reason. For example, `level` was added after we had worked around the problem for a while and hit limitations. The doc says neither of those things, only why the field exists: "since there's no way to represent the category forecast and the rest subcategory forecast differently in the db (both have `subcategoryId = null`), there's an additional field for the forecast layer: `level`".

## Structure

**Strict block scoping, the big one.** Each `##` section describes only its own concept. Don't reach into a section to pre-explain or justify a _different_ section's concept, even briefly. For example, a `Uniqueness` section states the unique-key fact and stops. It doesn't explain _why_ `level` exists, even though `level` is part of the key. That explanation belongs entirely inside the `Category Level vs Subcategory Level` section, restated there via "as was mentioned before" rather than assumed from an earlier section or linked to. When drafting a new section, ask whether each sentence belongs to the concept this heading names, or is actually explaining something a different heading owns. If it's the latter, cut it and let that other section say it in its own place.

**Headers**: short plain noun phrases, Title Case or sentence case (either is fine), never an em-dash or colon jammed into the header itself (not `## X — Y States`, just `## X`).

**Cross-references**: plain prose ("see below", "as was mentioned before"), never a markdown anchor link to another heading in the same file (`[Link](#some-slug)`). Cross-file links (`[Project](../project/PROJECT.md)`) are fine and already used.

**Lists**: numbered (`1. 2. 3.`) for a small enumerated set of states or cases (e.g. "a category can be in one of three states"). Dash bullets are for unordered facts and properties.

## Voice

**Vocabulary to avoid**: "materialize/materialized", "-driven" compounds (e.g. "value-driven"), "gate/gated", "invariant", "discriminator/discriminant", "atomically/atomic" as a technical qualifier. These read as bureaucratic or academic to the user. Plain equivalents: "creates", "based on values", "always equals", "field that tells them apart", "recalculates... every time".

**Hyphenation**: sparse. Only ordinary compounds a non-technical reader would already hyphenate (`non-zero`, `read-only`, `pre-filled`, `made-up`, `as-is`, `line-by-line`). Never coin a jargon compound like "touch-triggered" or "schema-driven".

**Trim restatement.** If a sentence already states X plainly, don't add a trailing em-dash clause that restates X in slightly different words "to be safe" (e.g. cut "...whether or not it has a value yet — showing Rest doesn't depend on any forecast being non-zero" down to just the first clause). Say it once.

**Rationale asides are welcome, even loosely phrased.** The user adds short "why we did it this way" sentences tied to a concrete, real concern. More than one design choice is justified by "so we don't overcomplicate the code/logic". These sentences can be grammatically loose ("was made not to overcomplicate the code"). Don't polish them into formal prose, because the looseness is part of the voice. When the real rationale of a design is known from earlier discussion, add it as this kind of aside rather than leaving the doc silent on "why".

**Explicit parenthetical scope clarifications.** When a general term might not obviously cover an edge case, call it out inline rather than leaving it implicit, e.g. "a subcategory's (including rest's) own badge only counts its own", spelling out that Rest counts as a subcategory here.

**Compare to sibling concepts up front.** Opening a doc or a section with a contrast to a related, already documented concept is a recurring device (BUDGETING.md's intro: "Forecasts, unlike transactions, represent _totals_ for the entire category or subcategory", with italics on the contrasted word). This can be restated later via "as was mentioned before" when it becomes relevant to a specific mechanism, rather than assuming the reader carried it forward.

## Overrides over unslop

Where this skill and `unslop` disagree, this skill wins:

- **An em dash after a bold label in a list is fine.** A bullet that names a field or term and then describes it keeps the form `- **`date`** — the primary date used in app logic`. Don't turn it into a sentence ("`date` is the primary date...") to get rid of the dash.

## The grand rule

**Never narrate discarded false assumptions.** When a review shows that something written was wrong (e.g. "the lock is triggered by Rest existing" turned out to be false), state the true fact plainly and let the wrong version disappear, with no trace of it in the doc. That means no "not because X", "not just because X", "it doesn't X", or any other clause whose only job is to rule out the discarded wrong belief. The reader never learns there was a wrong belief in the first place.

This is also a general instruction to use negatives sparingly: state what's true and don't spend words on what isn't, even outside the false-assumption case (e.g. prefer "the server recalculates this every time one of them changes" over "...it's never computed on the client").

## Before finishing

Reread the edit once, checking each of these:

- No description of a specific screen and no current production database state
- No history of changes: the doc reads as if the logic had always been this way
- Vocabulary and hyphenation
- Header shape
- No same-file anchor links
- One concept per section
- No restated clauses
- Numbered lists for enumerated states
- No leftover trace of a discarded false assumption, and negatives kept to a minimum
