-- Pool de bots Telegram pour les channels des agents
CREATE TABLE IF NOT EXISTS telegram_bots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_token TEXT NOT NULL UNIQUE,
  bot_username TEXT NOT NULL UNIQUE,
  bot_name TEXT NOT NULL DEFAULT 'AgentBox Bot',
  assigned_user_id TEXT DEFAULT NULL,
  assigned_agent_id TEXT DEFAULT NULL,
  custom_name TEXT DEFAULT NULL,
  custom_description TEXT DEFAULT NULL,
  webhook_url TEXT DEFAULT NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'disabled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_at TIMESTAMPTZ DEFAULT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE telegram_bots ENABLE ROW LEVEL SECURITY;

-- Users can view their own assigned bots
CREATE POLICY "Users can view own bots" ON telegram_bots
  FOR SELECT TO authenticated
  USING (assigned_user_id = auth.uid()::text OR status = 'available');

-- Only service role can insert/update (admin operations)
-- No insert/update policy for authenticated users - managed via edge functions

-- Indexes
CREATE INDEX IF NOT EXISTS idx_telegram_bots_status ON telegram_bots(status);
CREATE INDEX IF NOT EXISTS idx_telegram_bots_assigned_user ON telegram_bots(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_bots_assigned_agent ON telegram_bots(assigned_agent_id);
