// public/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');
importScripts('swenv.js');  // ← Import generated env file

const firebaseConfig = {
  apiKey: swEnv.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: swEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: swEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: swEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: swEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: swEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(
    payload.data.title,
    {
      body: payload.data.body,
      icon: '/favicon.ico',
      data: {
        url: payload.data.url
      }
    }
  );
});


self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/notifications';

  event.waitUntil(
    clients.openWindow(url)
  );
});