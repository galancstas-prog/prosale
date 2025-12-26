/*
  # Force schema refresh for PostgREST

  This will notify PostgREST to reload the schema
*/

-- Force the schema to be reloaded
SELECT pg_sleep(1);

-- Notify PostgREST/Supabase to reload schema cache
NOTIFY pgrst, 'reload schema';