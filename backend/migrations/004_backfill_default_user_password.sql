UPDATE users
SET password_hash = '$2b$10$0xQ28hiPjI1/N/yYOJFWUeFpjX9JU/llPfZX6KFBtqQsZbTuWDMhW',
    updated_at = datetime('now')
WHERE id = 1
  AND (password_hash IS NULL OR password_hash = '');
