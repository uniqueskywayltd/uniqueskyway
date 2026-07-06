-- Milestone 8: Admin platform support tables

CREATE TABLE IF NOT EXISTS customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  admin_user_id uuid NOT NULL REFERENCES admin_users(id),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_notes_profile_id_idx ON customer_notes(profile_id);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS login_disabled boolean NOT NULL DEFAULT false;
