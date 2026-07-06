-- M4: Profile address fields + notification archive support

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_line1 text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_line2 text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS postal_code text;

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone;
