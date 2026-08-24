ALTER TABLE app_users ADD COLUMN approved BOOLEAN NOT NULL DEFAULT FALSE;

-- Automatically approve existing users so they are not locked out
UPDATE app_users SET approved = TRUE;
