/*
  # Add display name to users table

  1. Changes
    - Add `display_name` column to users table (optional)
    - Column allows users to set a custom display name

  2. Security
    - No changes to RLS policies needed
    - Users can update their own display name through existing policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE users ADD COLUMN display_name text;
  END IF;
END $$;