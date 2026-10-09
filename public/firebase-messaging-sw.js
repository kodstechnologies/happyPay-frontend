importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
 apiKey: "AIzaSyCTtRFKG6xyp-Be_rkL2-kTMAbJrVAIo4A",
  authDomain: "happypay-5ecc8.firebaseapp.com",
  projectId: "happypay-5ecc8",
  storageBucket: "happypay-5ecc8.firebasestorage.app",
  messagingSenderId: "365178653696",
  appId: "1:365178653696:web:0c3250ec730e398cc09ce5",
  measurementId: "G-KNTGF0DNDN"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
