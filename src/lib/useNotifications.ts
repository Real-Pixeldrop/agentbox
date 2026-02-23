"use client";

import { useState, useCallback, useEffect } from 'react';
import { supabase } from './supabase';
import { useAuth } from './AuthContext';

export interface Notification {
  id: string;
  user_id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

/**
 * Hook that manages notifications from Supabase.
 */
export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications from Supabase
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchErr } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setNotifications((data || []) as Notification[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load notifications on mount and when user changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Add a new notification
  const addNotification = useCallback(async (notificationData: {
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
  }): Promise<Notification | null> => {
    if (!user) return null;

    try {
      const { data: newNotification, error: insertErr } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          read: false,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      const notification = newNotification as Notification;
      setNotifications(prev => [notification, ...prev]);
      return notification;
    } catch (err) {
      console.error('Failed to add notification:', err);
      return null;
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error: updateErr } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (updateErr) throw updateErr;

      setNotifications(prev => prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error: updateErr } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (updateErr) throw updateErr;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, [user]);

  // Delete a notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error: deleteErr } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (deleteErr) throw deleteErr;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}