import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = typeof window !== 'undefined' && 'serviceWorker' in navigator ? getMessaging(app) : null;

export const getFCMToken = async () => {
  if (!messaging) return null;
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // TODO: Replace with your VAPID key
      const currentToken = await getToken(messaging, {
        vapidKey: "YOUR_VAPID_KEY"
      });
      return currentToken;
    }
  } catch (error) {
    console.error("An error occurred while retrieving token:", error);
  }
  return null;
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (messaging) {
      onMessage(messaging, (payload) => {
        resolve(payload);
      });
    }
  });

export { app, messaging };
