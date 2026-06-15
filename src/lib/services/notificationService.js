// lib/notification-service.js

import { supabaseAdmin } from '@/lib/supabase-admin';
import { fcm } from '@/lib/firebase-admin';

// ------------------------------
// Helper: Send FCM push to multiple users
// ------------------------------
async function sendFCMToMultiple(receivers, title, message) {
  const fcmPromises = receivers.map(async (receiverId) => {
    try {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('fcm_token')
        .eq('user_id', receiverId)
        .single();

      if (user?.fcm_token) {
        await fcm.send({
          token: user.fcm_token,
          notification: { title, body: message || '' },
          webpush: { headers: { Urgency: 'high' } },
        });
      }
    } catch (err) {
      console.error(`FCM send error for ${receiverId}:`, err);
    }
  });

  await Promise.allSettled(fcmPromises);
}

// ------------------------------
// Helper: Get title/message from actions object
// ------------------------------
function getContent(notificationData, extra = {}) {
  let title, message;

  // Case 1: Direct object with title and message
  if (typeof notificationData === 'object' && notificationData.title && notificationData.message) {
    title = notificationData.title;
    message = notificationData.message;
  }
  // Case 2: Direct object with just message (use as both)
  else if (typeof notificationData === 'object' && notificationData.message) {
    title = notificationData.message;
    message = notificationData.message;
  }
  // Case 3: String message
  else if (typeof notificationData === 'string') {
    title = notificationData;
    message = notificationData;
  }
  // Case 4: Invalid
  else {
    console.warn('Invalid notification data:', notificationData);
    return { title: 'Notification', message: '' };
  }

  // Replace placeholders
  if (extra && Object.keys(extra).length) {
    Object.keys(extra).forEach(key => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      title = title.replace(regex, extra[key]);
      message = message.replace(regex, extra[key]);
    });
  }

  return { title, message };
}


// ------------------------------
// Main service
// ------------------------------
export const notificationService = {
  /**
   * Create dynamic notification for single or multiple users
   * @param {string|string[]} receiverIds - single user ID or array of user IDs
   * @param {string} notificationType - e.g. 'crm.targetCreated', 'admin.userCreated'
   * @param {string} senderId - user ID of the person triggering the notification
   * @param {Object} [options]
   * @param {string} [options.entityType] - related entity type (e.g., 'user', 'job_post')
   * @param {string} [options.entityId] - related entity ID
   * @param {Object} [options.extra] - dynamic values for placeholders
   * @returns {Promise<Object[]>} inserted notification records
   */
  async createDynamicNotification(receiverIds, notificationType, senderId, options = {}) {
    // Handle both single ID and array of IDs
    const receivers = Array.isArray(receiverIds) ? receiverIds : [receiverIds];
    if (receivers.length === 0) return [];

    const { title, message } = getContent(notificationType, options.extra);
    const entityType = options.entityType ?? null;
    const entityId = options.entityId ?? null;
    let type = 'p2p';
     if(receivers.length > 1){
      type = 'broadcast';
     }
    // Create notifications for all receivers
    const notifications = receivers.map(rid => ({
      sender_id: senderId,
      receiver_id: rid,
      type: type,
      title,
      message,
      entity_type: entityType,
      entity_id: entityId,
      created_at: new Date().toISOString(),
      is_read: false
    }));

    // Insert all notifications
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert(notifications)
      .select();
   console.log('Inserted notifications:', notifications, 'Error:', error);
    if (error) {
      throw new Error(`Failed to create notifications: ${error.message}`);
    }

    // Send FCM pushes to all receivers in background
    await sendFCMToMultiple(receivers, title, message);

    return data;
  },

  /**
   * Send notification to users by role
   * @param {string} role - user role (e.g., 'admin', 'manager', 'recruiter')
   * @param {string} notificationType - notification type from actions
   * @param {string} senderId - sender user ID
   * @param {Object} [options] - additional options
   * @returns {Promise<Object[]>} inserted notification records
   */
  async sendToRole(role, notificationType, senderId, options = {}) {
    // Fetch all users with the specified role
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('user_id')
      .eq('role', role);

    if (error) {
      throw new Error(`Failed to fetch users with role ${role}: ${error.message}`);
    }

    if (!users || users.length === 0) {
      console.warn(`No users found with role: ${role}`);
      return [];
    }

    const receiverIds = users.map(u => u.user_id);
    
    return this.createDynamicNotification(receiverIds, notificationType, senderId, options);
  },

  /**
   * Send notification to multiple roles
   * @param {string[]} roles - array of user roles
   * @param {string} notificationType - notification type from actions
   * @param {string} senderId - sender user ID
   * @param {Object} [options] - additional options
   * @returns {Promise<Object[]>} inserted notification records
   */
  async sendToMultipleRoles(roles, notificationType, senderId, options = {}) {
    // Fetch all users with any of the specified roles
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('user_id')
      .in('role', roles);

    if (error) {
      throw new Error(`Failed to fetch users with roles ${roles.join(', ')}: ${error.message}`);
    }

    if (!users || users.length === 0) {
      console.warn(`No users found with roles: ${roles.join(', ')}`);
      return [];
    }

    // Remove duplicates (in case a user has multiple roles - though unlikely)
    const receiverIds = [...new Set(users.map(u => u.user_id))];
    
    return this.createDynamicNotification(receiverIds, notificationType, senderId, options);
  },

  /**
   * Send notification to all users except sender
   * @param {string} notificationType - notification type from actions
   * @param {string} senderId - sender user ID (will be excluded)
   * @param {Object} [options] - additional options
   * @returns {Promise<Object[]>} inserted notification records
   */
  async sendToAllExcept(notificationType, senderId, options = {}) {
    // Fetch all users except sender
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('user_id')
      .neq('user_id', senderId);

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    if (!users || users.length === 0) {
      console.warn('No other users found');
      return [];
    }

    const receiverIds = users.map(u => u.user_id);
    
    return this.createDynamicNotification(receiverIds, notificationType, senderId, options);
  },

  /**
   * Send notification to specific team/group
   * @param {string[]} teamMemberIds - array of team member user IDs
   * @param {string} notificationType - notification type from actions
   * @param {string} senderId - sender user ID
   * @param {Object} [options] - additional options
   * @returns {Promise<Object[]>} inserted notification records
   */
  async sendToTeam(teamMemberIds, notificationType, senderId, options = {}) {
    if (!teamMemberIds || teamMemberIds.length === 0) {
      console.warn('No team members provided');
      return [];
    }

    return this.createDynamicNotification(teamMemberIds, notificationType, senderId, options);
  }
};