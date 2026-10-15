import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage, type MessagePayload } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCTtRFKG6xyp-Be_rkL2-kTMAbJrVAIo4A",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "happypay-5ecc8.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "happypay-5ecc8",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "happypay-5ecc8.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "365178653696",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:365178653696:web:0c3250ec730e398cc09ce5",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-KNTGF0DNDN"
};

// Initialize Firebase App safely
const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

const messaging =
  typeof window !== "undefined" && "serviceWorker" in navigator && "Notification" in window
    ? getMessaging(app)
    : null;

export const getFCMToken = async (): Promise<string | null> => {
  if (!messaging || typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";
  if (!vapidKey || vapidKey === "YOUR_VAPID_KEY") {
    // Graceful fallback: VAPID key is not yet set in environment.
    // Return null without throwing an unhandled exception to prevent breaking login/onboarding.
    return null;
  }

  try {
    const fetchTokenPromise = (async () => {
      let permission = Notification.permission;
      if (permission === "default") {
        permission = await Notification.requestPermission();
      }

      if (permission !== "granted") {
        return null;
      }

      let swRegistration: ServiceWorkerRegistration | undefined;
      try {
        swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        await navigator.serviceWorker.ready;
      } catch (swError) {
        console.warn("[FCM] Service worker registration notice:", swError);
      }

      const currentToken = await getToken(messaging, {
        vapidKey,
        ...(swRegistration ? { serviceWorkerRegistration: swRegistration } : {}),
      });

      return currentToken || null;
    })();

    // 3.5s timeout protection to guarantee login or registration never blocks
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 3500)
    );

    return await Promise.race([fetchTokenPromise, timeoutPromise]);
  } catch (error) {
    console.warn("[FCM] Notice while retrieving token (proceeding without push token):", error);
    return null;
  }
};

export const registerForegroundNotificationHandler = (
  onReceive: (payload: MessagePayload) => void
): (() => void) => {
  if (!messaging) {
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    onReceive(payload);
  });
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

