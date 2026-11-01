# Project Users

Who has access to the current project (household). Every member can see the list, only an admin can change it. Every `User` belongs to exactly one `Project` for life — there is no cross-project membership or project switching.

## Roles

- `user` — default role, full access to all app features, and can see the list of project members without changing anything.
- `admin` — everything a `user` can do, plus adding or removing project members, and turning category autofill on or off. Role doesn't affect anything else in the app.

## Adding a user

Sign-up is closed — there is no public registration. An admin adds a user with just an email, name, and role — the server generates a random temporary password and returns it once in the response. After that, it is only ever stored hashed and cannot be retrieved again in plaintext, by anyone, through the app. The new user can sign in immediately with that password, or via Google using the same email (Better Auth auto-links by email match).

Our Google OAuth consent screen is in "Testing" publishing mode, so Google sign-in only works for emails explicitly added as test users in the Google Cloud Console project — a new user must be added there too before Google sign-in works for them (the password sign-in above works regardless).

## Passwords and account settings

Nobody — not even an admin — can set or reset another user's password from the app. Every user (any role) manages their own name and password from **My Account** (`~/features/account`). Password changes require the current password (Better Auth's built-in `changePassword` endpoint); email is not editable there. There is no self-service "forgot password" flow: if a user forgets their password and can't sign in to change it, the only recourse is `scripts/reset-password.ts`, run directly against the database by someone with infra access.

## Removing a user

Removal is a hard delete of the `User` row (and its `Session`/`Account` rows via cascade) — no soft-deactivation, no audit trail. Removing a user is blocked if they are the project's last remaining admin, to avoid locking the project out of user management entirely.
