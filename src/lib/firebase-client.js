import { initializeApp, getApps, getApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { apiPost } from '@/lib/api-client'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null

export async function requestFCMToken(userId, accessToken) {
  if (!messaging) return null
  
  try {
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    })

    console.log('FCM token obtained:', token ? 'Yes' : 'No')
    
    // Use apiPost with cookies - accessToken is no longer needed
    // The api-client automatically includes cookies via credentials: 'include'
    const response = await apiPost('/api/user/fcm-token', { 
      fcm_token: token,
      user_id: userId // Include userId for additional verification
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Server response:', errorText)
      throw new Error(`Failed to save FCM token: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('FCM token saved successfully:', data)
    
    return token
  } catch (err) {
    console.error('FCM token error:', err)
    return null
  }
}

export function onForegroundMessage(callback) {
  if (!messaging) {
    console.warn('Messaging not available (server-side)')
    return
  }
  
  try {
    onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload)
      callback(payload)
    })
  } catch (error) {
    console.error('Error setting up foreground message listener:', error)
  }
}