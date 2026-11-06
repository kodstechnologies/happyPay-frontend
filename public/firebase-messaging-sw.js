importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// TODO: Replace with your actual Firebase project configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyDFEmWcYpdSmgPFTk7JIQcuNTkq1LKhfKw",
//   authDomain: "happy-pay-6412d.firebaseapp.com",
//   projectId: "happy-pay-6412d",
//   storageBucket: "happy-pay-6412d.firebasestorage.app",
//   messagingSenderId: "459727361970",
//   appId: "1:459727361970:web:b6c3373f5be5137fbd36ab",
//   measurementId: "G-JX1753ZZK3"
// };

const firebaseConfig = {
  apiKey: "AIzaSyCKgAREeRpl2zLliHAIy7XsZUY36coCkvU",
  authDomain: "happypayfintech-32bd2.firebaseapp.com",
  projectId: "happypayfintech-32bd2",
  storageBucket: "happypayfintech-32bd2.firebasestorage.app",
  messagingSenderId: "446588836534",
  appId: "1:446588836534:web:43a85ddce331d738fb2417",
  measurementId: "G-HN50FKMZZX"
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
