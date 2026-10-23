importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDFEmWcYpdSmgPFTk7JIQcuNTkq1LKhfKw",
  authDomain: "happy-pay-6412d.firebaseapp.com",
  projectId: "happy-pay-6412d",
  storageBucket: "happy-pay-6412d.firebasestorage.app",
  messagingSenderId: "459727361970",
  appId: "1:459727361970:web:b6c3373f5be5137fbd36ab",
  measurementId: "G-JX1753ZZK3"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload?.notification?.title || payload?.data?.title || "HappyPay Notification";
  const notificationOptions = {
    body: payload?.notification?.body || payload?.data?.body || "",
    icon: "/happy-favicon.jpeg",
    data: payload?.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
