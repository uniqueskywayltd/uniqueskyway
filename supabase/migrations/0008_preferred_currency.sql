-- M4: Preferred currency on profile preferences

ALTER TABLE profile_preferences ADD COLUMN IF NOT EXISTS preferred_currency text NOT NULL DEFAULT 'USD';
