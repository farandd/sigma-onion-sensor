/*
  # Fix lands primary key

  The app stores panel and portable lands with the same readable IDs
  such as `lahan1`. The previous primary key `(id, user_id)` prevents
  one user from having both `panel/lahan1` and `portable/lahan1`.
*/

DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT tc.constraint_name INTO constraint_name
  FROM information_schema.table_constraints tc
  WHERE tc.table_name = 'lands'
    AND tc.constraint_type = 'PRIMARY KEY'
  LIMIT 1;

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE lands DROP CONSTRAINT %I', constraint_name);
  END IF;

  ALTER TABLE lands
    ADD CONSTRAINT lands_pkey PRIMARY KEY (id, user_id, system_type);
END $$;

CREATE INDEX IF NOT EXISTS idx_lands_user_system
  ON lands (user_id, system_type, id);

