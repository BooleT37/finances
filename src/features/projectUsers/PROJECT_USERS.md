# Project Users

Admin-only management of who has access to the current project (household). Every `User` belongs to exactly one `Project` for life — there is no cross-project membership or project switching.

This lives as a section (`ProjectUsersTable`) on the same `/settings/project` page as [Project](../project/PROJECT.md) info, composed together in the route file (`_authenticated.settings.project.tsx`) rather than in either feature — the route only renders this section when `session.role === 'admin'`, since `fetchProjectUsers` itself is `adminMiddleware`-gated and would error for anyone else.

## Roles

- `user` — default role, full access to all app features except the users section of this page.
- `admin` — everything a `user` can do, plus the users section on `/settings/project` to add or remove other project members. Role does not gate anything else in the app.

## Adding a user

Sign-up is closed — there is no public registration. An admin adds a user here with just an email, name, and role — the server generates a random temporary password and returns it once in the response. The modal shows it with a copy button and cannot be dismissed accidentally (no click-outside/Escape close) while it's visible; once closed, it is only ever stored hashed and cannot be retrieved again in plaintext, by anyone, through the app. The new user can sign in immediately with that password, or via Google using the same email (Better Auth auto-links by email match).

Our Google OAuth consent screen is in "Testing" publishing mode, so Google sign-in only works for emails explicitly added as test users in the Google Cloud Console project — a new user must be added there too before Google sign-in works for them (the password sign-in above works regardless).

## Passwords and account settings

Nobody — not even an admin — can set or reset another user's password from the app. Every user (any role) manages their own name and password from **My Account** (`/settings/account`, `~/features/account`), reachable from the same nav group as this page — not gated by role, since regular users can't reach the users section. Password changes require the current password (Better Auth's built-in `changePassword` endpoint, called directly from the client via `ChangePasswordForm` in `~/features/auth`); email is not editable there. There is no self-service "forgot password" flow: if a user forgets their password and can't sign in to change it, the only recourse is `scripts/reset-password.ts`, run directly against the database by someone with infra access.

## Removing a user

Removal is a hard delete of the `User` row (and its `Session`/`Account` rows via cascade) — no soft-deactivation, no audit trail. Removing a user is blocked if they are the project's last remaining admin, to avoid locking the project out of user management entirely.
