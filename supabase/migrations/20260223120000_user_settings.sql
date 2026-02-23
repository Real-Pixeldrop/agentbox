-- ============================================================
-- AgentBox Beta - User Settings & Credentials
-- ============================================================

-- =========================
-- 1. User Settings table (per-user preferences)
-- =========================
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Email credentials (encrypted - stored as ciphertext)
  email_imap_host TEXT,
  email_imap_port INTEGER,
  email_imap_user TEXT,
  email_imap_password TEXT,      -- encrypted
  email_smtp_host TEXT,
  email_smtp_port INTEGER,
  email_smtp_user TEXT,
  email_smtp_password TEXT,      -- encrypted
  email_from_name TEXT,
  email_from_address TEXT,
  
  -- GitHub
  github_token TEXT,             -- encrypted
  github_username TEXT,
  
  -- Workspace info
  workspace_initialized BOOLEAN DEFAULT FALSE,
  workspace_size_bytes BIGINT DEFAULT 0,
  
  -- Misc
  preferred_language TEXT DEFAULT 'FR',
  timezone TEXT DEFAULT 'Europe/Paris',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================
-- 2. User API Keys (BYOK - Bring Your Own Key)
-- =========================
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,          -- 'anthropic', 'openai', 'google', etc.
  api_key TEXT NOT NULL,           -- encrypted
  label TEXT,                      -- user-friendly name
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider, label)
);

-- =========================
-- 3. RLS Policies
-- =========================
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- user_settings
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can view own settings') THEN
    CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can insert own settings') THEN
    CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can update own settings') THEN
    CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- user_api_keys
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_api_keys' AND policyname = 'Users can view own api keys') THEN
    CREATE POLICY "Users can view own api keys" ON public.user_api_keys FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_api_keys' AND policyname = 'Users can insert own api keys') THEN
    CREATE POLICY "Users can insert own api keys" ON public.user_api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_api_keys' AND policyname = 'Users can update own api keys') THEN
    CREATE POLICY "Users can update own api keys" ON public.user_api_keys FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_api_keys' AND policyname = 'Users can delete own api keys') THEN
    CREATE POLICY "Users can delete own api keys" ON public.user_api_keys FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- =========================
-- 4. Indexes
-- =========================
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON public.user_api_keys(user_id);

-- =========================
-- 5. Updated_at triggers
-- =========================
DROP TRIGGER IF EXISTS user_settings_updated_at ON public.user_settings;
CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS user_api_keys_updated_at ON public.user_api_keys;
CREATE TRIGGER user_api_keys_updated_at
  BEFORE UPDATE ON public.user_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
