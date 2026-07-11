# Project Users

Admin-only management of who has access to the current project (household). Every `User` belongs to exactly one `Project` for life — there is no cross-project membership or project switching.

## Roles

- `user` — default role, full access to all app features except this page.
- `admin` — everything a `user` can do, plus access to `/settings/users` to add, reset the password of, or remove other project members. Role does not gate anything else in the app.

## Adding a user

Sign-up is closed — there is no public registration. An admin adds a user here with an email, name, and a temporary password (shown/typed once by the admin, not emailed). The new user can sign in immediately with that password, or via Google using the same email (Better Auth auto-links by email match).

## Resetting a password

There is no self-service "forgot password" flow. If a user forgets their password, an admin resets it from this page the same way a new user is created — the reset password is a new temporary password shared out-of-band.

## Removing a user

Removal is a hard delete of the `User` row (and its `Session`/`Account` rows via cascade) — no soft-deactivation, no audit trail. Removing a user is blocked if they are the project's last remaining admin, to avoid locking the project out of user management entirely.
