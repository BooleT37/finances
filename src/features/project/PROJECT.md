# Project

The current project's (household's) own identity — currently just its name.

Visible to every project member at `/settings/project`. Renaming is restricted to admins (`adminMiddleware`); non-admins see the name as read-only text, not a disabled input.

The same `/settings/project` page also shows [Project Users](../projectUsers/PROJECT_USERS.md) management below the name, for admins only — that section is composed in at the route level (`_authenticated.settings.project.tsx`), not inside this feature, since it belongs to a different feature.

Account settings (`~/features/account`, your own name/password) are a separate concern with their own page (`/settings/account`), reachable from the same nav group as this page.
