-- ============================================================
-- FIX: "Database error querying schema" on login
-- Run this ONCE if you already created users with migration 012
-- before the token columns were added.
--
-- Sets confirmation_token, email_change, email_change_token_new,
-- recovery_token to '' for users where they are NULL.
-- ============================================================

UPDATE auth.users
SET
  confirmation_token     = COALESCE(confirmation_token, ''),
  email_change           = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  recovery_token         = COALESCE(recovery_token, '')
WHERE confirmation_token IS NULL
   OR email_change IS NULL
   OR email_change_token_new IS NULL
   OR recovery_token IS NULL;
