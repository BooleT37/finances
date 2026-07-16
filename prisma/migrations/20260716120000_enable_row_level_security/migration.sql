-- Production runs on Supabase, which auto-grants anon/authenticated (the roles
-- behind its public PostgREST API) every privilege on each new table in public
-- (see pg_default_acl). RLS with no policies is what makes a table unreachable
-- for them; the app's own role bypasses RLS, so this costs it nothing.
--
-- The pre-auth database had this on every table already (finances-t3 added it),
-- but that history isn't part of this repo's migrations, so a fresh Supabase
-- deploy had none of it — and the Project/auth tables were never covered at all.
-- ENABLE ROW LEVEL SECURITY is a no-op where it's already on.

-- Project + auth tables (Session/Account hold session tokens and password hashes)
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectSetting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Verification" ENABLE ROW LEVEL SECURITY;

-- Domain tables
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subcategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Source" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SavingSpending" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SavingSpendingCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Expense" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExpenseComponent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Forecast" ENABLE ROW LEVEL SECURITY;
