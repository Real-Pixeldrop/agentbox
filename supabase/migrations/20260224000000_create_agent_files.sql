-- ============================================================
-- agent_files: workspace file storage for agents
-- Stores SOUL.md, TOOLS.md, MEMORY.md, memory/*.md, skills/*, etc.
-- Source of truth when gateway is not connected.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.agent_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,            -- e.g. "SOUL.md", "TOOLS.md", "memory/2026-02-23.md", "skills/email/SKILL.md"
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (agent_id, file_path)
);

-- Index for fast lookups by agent + path
CREATE INDEX IF NOT EXISTS idx_agent_files_agent_id ON public.agent_files(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_files_agent_path ON public.agent_files(agent_id, file_path);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_agent_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS agent_files_updated_at ON public.agent_files;
CREATE TRIGGER agent_files_updated_at
  BEFORE UPDATE ON public.agent_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_agent_files_updated_at();

-- RLS: users can only access files of agents they own
ALTER TABLE public.agent_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view files of own agents" ON public.agent_files
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.agents WHERE id = agent_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert files for own agents" ON public.agent_files
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.agents WHERE id = agent_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update files of own agents" ON public.agent_files
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.agents WHERE id = agent_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete files of own agents" ON public.agent_files
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.agents WHERE id = agent_id AND user_id = auth.uid())
  );
