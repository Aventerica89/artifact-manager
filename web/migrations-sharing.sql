-- Add sharing fields to collections table
-- Run this migration to enable collection sharing feature

-- Add sharing fields (if they don't exist)
ALTER TABLE collections ADD COLUMN is_public INTEGER DEFAULT 0;
ALTER TABLE collections ADD COLUMN share_token TEXT;
ALTER TABLE collections ADD COLUMN share_settings TEXT;
ALTER TABLE collections ADD COLUMN shared_at DATETIME;

-- Create indexes for public lookups
CREATE INDEX IF NOT EXISTS idx_collections_share_token ON collections(share_token);
CREATE INDEX IF NOT EXISTS idx_collections_public ON collections(is_public, user_email);
