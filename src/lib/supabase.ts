import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder');

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: 'free' | 'pro' | 'enterprise';
  created_at: string;
};

export type Agent = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  personality: string | null;
  model: string;
  status: 'active' | 'inactive' | 'archived';
  gateway_agent_id: string | null;
  gateway_session_key: string | null;
  config: Record<string, unknown>;
  photo_url: string | null;
  tone: string | null;
  industry: string | null;
  skills: string[];
  created_at: string;
  updated_at: string;
};

export type Team = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export type TeamMember = {
  team_id: string;
  agent_id: string;
};
