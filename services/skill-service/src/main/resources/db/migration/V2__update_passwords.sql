-- Update all app_users' passwords to 'password' using a verified BCrypt hash
UPDATE app_users SET password_hash = '$2a$10$ABQ4YRSLyk/nTmb8Csvw0eBUwPtxZ90GjNsac2zmL8R8Wcb.tSzjq';
