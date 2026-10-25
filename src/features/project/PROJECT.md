# Project

A project is a household. Everything in the app belongs to a project rather than to a single user: categories, sources, transactions, budgets, subscriptions and savings. Every member of a project works with the same data.

## Members

A user belongs to exactly one project for as long as the user exists, and can't be moved to another one. Each member is either an admin or a regular user. Who the members are and what each role can do is described in [Project Users](../projectUsers/PROJECT_USERS.md).

A new project is only ever created by `scripts/bootstrap-project.ts`, together with its first admin, since there is no public sign-up.

## Name

A project has a name. Only an admin can change it.

## Settings

A project has one set of settings that applies to the whole household, such as the order of categories and sources and whether category autofill is on. They live in `~/features/projectSettings`. What category autofill does is described in [Transactions](../transactions/TRANSACTIONS.md).
