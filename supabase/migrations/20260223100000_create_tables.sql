-- Add missing columns to agents table
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS tone text DEFAULT 'Friendly';
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}';

-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create team_members join table
CREATE TABLE IF NOT EXISTS public.team_members (
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  PRIMARY KEY (team_id, agent_id)
);

-- Enable RLS on all tables
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for teams
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teams' AND policyname = 'Users can view own teams') THEN
    CREATE POLICY "Users can view own teams" ON public.teams FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teams' AND policyname = 'Users can insert own teams') THEN
    CREATE POLICY "Users can insert own teams" ON public.teams FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teams' AND policyname = 'Users can update own teams') THEN
    CREATE POLICY "Users can update own teams" ON public.teams FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teams' AND policyname = 'Users can delete own teams') THEN
    CREATE POLICY "Users can delete own teams" ON public.teams FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- RLS policies for team_members (user must own the team)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'Users can view own team members') THEN
    CREATE POLICY "Users can view own team members" ON public.team_members FOR SELECT USING (EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'Users can manage own team members') THEN
    CREATE POLICY "Users can manage own team members" ON public.team_members FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'Users can remove own team members') THEN
    CREATE POLICY "Users can remove own team members" ON public.team_members FOR DELETE USING (EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND user_id = auth.uid()));
  END IF;
END $$;

-- Updated_at trigger for agents
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS agents_updated_at ON public.agents;
CREATE TRIGGER agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
