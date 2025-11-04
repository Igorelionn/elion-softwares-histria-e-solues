-- Add language column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'pt';

-- Add comment for documentation
COMMENT ON COLUMN users.language IS 'User preferred language (pt, en, es, fr, de, it, zh, ja)';

