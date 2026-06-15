import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { requestFCMToken, onForegroundMessage } from '@/lib/firebase-client';

export function useNotifications() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Track authenticated user
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener?.subscription.unsubscribe();
  }, []);

  // Safe API caller
  const apiCall = async (url, options = {}) => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) throw new Error('No access token');
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API error ${response.status}: ${text.substring(0, 100)}`);
    }
    return response.json();
  };

  // 2. Fetch historical notifications
  const fetchNotifications = async (unreadOnly = false) => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiCall(`/api/notifications?unreadOnly=${unreadOnly}`);
      setNotifications(data.notifications);
      if (!unreadOnly) {
        const unreadData = await apiCall('/api/notifications?unreadOnly=true');
        setUnreadCount(unreadData.total);
      }
      setError(null);
    } catch (err) {
      console.error('fetchNotifications error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Mark as read
  const markAsRead = async (id) => {
    if (!user) return;
    const previousNotifications = notifications;
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await apiCall(`/api/notifications/${id}`, { method: 'PATCH', body: JSON.stringify({ is_read: true }) });
    } catch (err) {
      console.error('markAsRead error:', err);
      // Rollback
      setNotifications(previousNotifications);
      setUnreadCount(previousNotifications.filter(n => !n.is_read).length);
    }
  };

  // 4. Delete notification
  const deleteNotification = async (id) => {
    if (!user) return;
    const previousNotifications = notifications;
    const deletedWasUnread = notifications.find(n => n.id === id)?.is_read === false;
    // Optimistic update
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (deletedWasUnread) setUnreadCount(prev => prev - 1);
    try {
      await apiCall(`/api/notifications/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('deleteNotification error:', err);
      // Rollback
      setNotifications(previousNotifications);
      setUnreadCount(previousNotifications.filter(n => !n.is_read).length);
    }
  };

  // 5. FCM token & foreground messages
  useEffect(() => {
    if (!user) return;
    const initFCM = async () => {
      if (typeof window !== 'undefined' && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      if (accessToken) {
        await requestFCMToken(accessToken);
      }
    };
    initFCM();
    const unsubscribe = onForegroundMessage(() => {
      fetchNotifications(); // refresh list on incoming push
    });
    return () => unsubscribe?.();
  }, [user]);

  // 6. Supabase Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `receiver_id=eq.${user.id}`,
      }, (payload) => {
        const newNotif = payload.new;
        setNotifications(prev => [newNotif, ...prev]);
        if (!newNotif.is_read) setUnreadCount(prev => prev + 1);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `receiver_id=eq.${user.id}`,
      }, (payload) => {
        const updated = payload.new;
        setNotifications(prev => prev.map(n => n.id === updated.id ? updated : n));
        // Recalculate unread count more efficiently
        setUnreadCount(prev => {
          const oldWasUnread = notifications.find(n => n.id === updated.id)?.is_read === false;
          const newIsUnread = !updated.is_read;
          if (oldWasUnread && !newIsUnread) return Math.max(0, prev - 1);
          if (!oldWasUnread && newIsUnread) return prev + 1;
          return prev;
        });
      })
      .subscribe();
    fetchNotifications();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return { notifications, unreadCount, loading, error, markAsRead, deleteNotification, refresh: fetchNotifications };
}