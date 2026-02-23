"use client";

import { useState, useCallback, useEffect } from 'react';
import { supabase, type Team } from './supabase';
import { useAuth } from './AuthContext';

/**
 * Hook that manages teams from Supabase.
 */
export function useTeams() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch teams from Supabase
  const fetchTeams = useCallback(async () => {
    if (!user) {
      setTeams([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchErr } = await supabase
        .from('teams')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setTeams((data || []) as Team[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch teams');
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load teams on mount and when user changes
  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Create a team in Supabase
  const createTeam = useCallback(async (teamData: {
    name: string;
    description?: string;
  }): Promise<Team> => {
    if (!user) throw new Error('Not authenticated');

    const { data: newTeam, error: insertErr } = await supabase
      .from('teams')
      .insert({
        user_id: user.id,
        name: teamData.name,
        description: teamData.description || null,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    const team = newTeam as Team;
    setTeams(prev => [team, ...prev]);
    return team;
  }, [user]);

  // Delete a team from Supabase
  const deleteTeam = useCallback(async (teamId: string) => {
    const { error: deleteErr } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (deleteErr) throw deleteErr;

    setTeams(prev => prev.filter(t => t.id !== teamId));
  }, []);

  return {
    teams,
    loading,
    error,
    fetchTeams,
    createTeam,
    deleteTeam,
  };
}