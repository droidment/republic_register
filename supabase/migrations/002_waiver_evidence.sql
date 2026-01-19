-- Add waiver evidence fields for stronger legal compliance
-- Run this in Supabase SQL Editor

-- Add new columns for waiver evidence
ALTER TABLE team_players
ADD COLUMN IF NOT EXISTS typed_signature TEXT,
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS waiver_version INTEGER;

-- Add comment explaining the fields
COMMENT ON COLUMN team_players.typed_signature IS 'Player types their full name as electronic signature confirmation';
COMMENT ON COLUMN team_players.ip_address IS 'IP address at time of waiver signing for audit trail';
COMMENT ON COLUMN team_players.user_agent IS 'Browser/device info at time of signing for audit trail';
COMMENT ON COLUMN team_players.waiver_version IS 'Version of waiver content that was signed';
