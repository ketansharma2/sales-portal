// lib/firebase-client.js
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

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

    const session = JSON.parse(localStorage.getItem('session') || '{}');
    // Save token to Supabase
    await fetch('/api/user/fcm-token', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ fcm_token: token }),
    })
    return token
  } catch (err) {
    console.error('FCM token error:', err)
    return null
  }
}

export function onForegroundMessage(callback) {
  if (!messaging) return
  onMessage(messaging, (payload) => {
    callback(payload)
  })
}