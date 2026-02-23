"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, type Profile, type Agent } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data as Profile);
    }
  }, []);

  const createDefaultAgent = useCallback(async (userId: string) => {
    // Check if user already has agents
    const { data: existingAgents } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (existingAgents && existingAgents.length > 0) {
      // User already has agents, skip default creation
      return;
    }

    // Create default "main" agent
    const defaultAgent: Omit<Agent, 'id' | 'created_at' | 'updated_at'> = {
      user_id: userId,
      name: 'Assistant',
      description: 'Your main AI assistant',
      personality: null,
      model: 'claude-sonnet-4-20250514',
      status: 'active',
      gateway_agent_id: 'main',
      gateway_session_key: 'agent:main:main',
      config: {},
      photo_url: null,
      tone: null,
      industry: null,
      skills: []
    };

    const { error } = await supabase
      .from('agents')
      .insert(defaultAgent);

    if (error) {
      console.error('Failed to create default agent:', error);
    }
  }, []);

  const handleSession = useCallback(
    async (session: Session | null) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    },
    [fetchProfile]
  );

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: error.message };
    
    // If signup was successful and user is created, create default agent
    if (data.user) {
      await createDefaultAgent(data.user.id);
    }
    
    return { error: null };
  }, [createDefaultAgent]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
