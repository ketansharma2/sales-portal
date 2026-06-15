importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-messaging-compat.js');

// ⚠️ REPLACE THE VALUES BELOW WITH YOUR ACTUAL FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyB7YLbEeWqg9A7mJ1HOjLvzNN3o5NVEw-g",               // e.g., "AIzaSyD..."
  projectId: "sales-e7512",         // e.g., "my-app-12345"
  messagingSenderId: "891722169749",  // e.g., "1234567890"
  appId: "1:891722169749:web:589441738a38fa0cc0ca9c"                  // e.g., "1:1234567890:web:abc123def456"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message:', payload);
  const notificationTitle = payload.notification?.title || 'Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/favicon.ico'  // optional – add an icon to your public folder
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});