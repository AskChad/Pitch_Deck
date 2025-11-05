-- Create a function to execute SQL commands
-- This allows us to configure auth settings programmatically

CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE query;
  RETURN json_build_object('success', true, 'message', 'SQL executed successfully');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;

-- Configure Supabase auth settings
DO $$
BEGIN
  -- Update site URL
  INSERT INTO auth.config (name, value)
  VALUES ('site_url', 'https://pitch-deck-kappa.vercel.app')
  ON CONFLICT (name) DO UPDATE SET value = EXCLUDED.value;

  -- Update redirect URLs
  INSERT INTO auth.config (name, value)
  VALUES ('uri_allow_list', 'https://pitch-deck-kappa.vercel.app,https://pitch-deck-kappa.vercel.app/auth/callback,http://localhost:3000,http://localhost:3000/auth/callback')
  ON CONFLICT (name) DO UPDATE SET value = EXCLUDED.value;

  -- Enable email authentication
  INSERT INTO auth.config (name, value)
  VALUES ('external_email_enabled', 'true')
  ON CONFLICT (name) DO UPDATE SET value = EXCLUDED.value;

  -- Auto-confirm emails for easier testing
  INSERT INTO auth.config (name, value)
  VALUES ('mailer_autoconfirm', 'true')
  ON CONFLICT (name) DO UPDATE SET value = EXCLUDED.value;

  RAISE NOTICE 'Auth configuration updated successfully';
END $$;
