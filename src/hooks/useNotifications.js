import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { requestFCMToken, onForegroundMessage } from '@/lib/firebase-client';
import { apiGet, apiPut, apiDelete } from '@/lib/api-client';
export function useNotifications() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Add refs to fix stale closures
  const notificationsRef = useRef(notifications);
  const unreadCountRef = useRef(unreadCount);

  // Sync refs with state
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  useEffect(() => {
    unreadCountRef.current = unreadCount;
  }, [unreadCount]);

  // 1. Track authenticated user
useEffect(() => {
  async function loadUser() {
    const response = await apiGet("/api/auth/get-current-user");
       
    if (!response.ok) return;

    const data = await response.json();

    console.log("Current User:", data);

    setUser(data);
  }

  loadUser();
}, []);



  // 2. Fetch historical notifications
  const fetchNotifications = async (unreadOnly = false) => {
    console.log("test1");
    if (!user) return;
    setLoading(true);
    try {
     const response = await apiGet(`/api/notifications?unreadOnly=${unreadOnly}`);
     console.log("response12",response);
     if (!response.ok) throw new Error(`API error ${response.status}`);
     const data = await response.json();
      setNotifications(data.notifications);
      if (!unreadOnly) {
        const unreadData = await apiGet('/api/notifications?unreadOnly=true');
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

  // 3. Mark as read - FIXED
  const markAsRead = async (id) => {
    if (!user) return;
    
    // Check if already read using ref
    const existing = notificationsRef.current.find(n => n.id === id);
    if (!existing || existing.is_read) return;
    
    const previousNotifications = notificationsRef.current;
    const previousUnreadCount = unreadCountRef.current;
    
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    try {
const response = await apiPut(`/api/notifications/${id}`, { is_read: true });
if (!response.ok) throw new Error(`Failed to mark as read`);
    } catch (err) {
      console.error('markAsRead error:', err);
      // Rollback
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
    }
  };

  // 4. Delete notification - FIXED
  const deleteNotification = async (id) => {
    if (!user) return;
    
    const previousNotifications = notificationsRef.current;
    const previousUnreadCount = unreadCountRef.current;
    const deletedWasUnread = previousNotifications.find(n => n.id === id)?.is_read === false;
    
    // Optimistic update
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (deletedWasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    try {
     const response = await apiDelete(`/api/notifications/${id}`);
     if (!response.ok) throw new Error(`Failed to delete`);
    } catch (err) {
      console.error('deleteNotification error:', err);
      // Rollback
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
    }
  };

  // 5. FCM token & foreground messages
  useEffect(() => {
      console.log("Notification effect started",user);
    if (!user) return;
    const initFCM = async () => {
      if (typeof window !== 'undefined' && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      
      if (user?.id) {
  await requestFCMToken(user.id);
}
    };
    initFCM();
    const unsubscribe = onForegroundMessage(() => {
      fetchNotifications();
    });
    return () => unsubscribe?.();
  }, [user]);

  // 6. Supabase Realtime subscription - FIXED
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
        setNotifications(prev => {
          // Prevent duplicates
          if (prev.some(n => n.id === newNotif.id)) return prev;
          return [newNotif, ...prev];
        });
        if (!newNotif.is_read) {
          setUnreadCount(prev => prev + 1);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `receiver_id=eq.${user.id}`,
      }, (payload) => {
        const updated = payload.new;
        
        setNotifications(prev => 
          prev.map(n => n.id === updated.id ? updated : n)
        );
        
        // Fix unread count using refs
        const oldNotification = notificationsRef.current.find(n => n.id === updated.id);
        if (oldNotification) {
          const wasUnread = !oldNotification.is_read;
          const isNowUnread = !updated.is_read;
          
          if (wasUnread && !isNowUnread) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          } else if (!wasUnread && isNowUnread) {
            setUnreadCount(prev => prev + 1);
          }
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'notifications',
        filter: `receiver_id=eq.${user.id}`,
      }, (payload) => {
        const deletedId = payload.old.id;
        
        // Check if deleted notification was unread using ref
        const deletedNotification = notificationsRef.current.find(n => n.id === deletedId);
        const wasUnread = deletedNotification?.is_read === false;
        
        setNotifications(prev => prev.filter(n => n.id !== deletedId));
        
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      })
      .subscribe();
      
    fetchNotifications();
    
    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [user]);

  return { 
    notifications, 
    unreadCount, 
    loading, 
    error, 
    markAsRead, 
    deleteNotification, 
    refresh: fetchNotifications 
  };
}