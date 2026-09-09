import {
  initializeApp,
  getApps,
  getApp,
} from "firebase/app";

import {
  initializeAuth,
  browserLocalPersistence,
  GoogleAuthProvider,
} from "firebase/auth";

import {
  getFirestore,
} from "firebase/firestore";

import {
  getStorage,
} from "firebase/storage";

const firebaseConfig = {
  apiKey:
    "AIzaSyD1q8gr07P93PGbP55ObJ7tYev2D0vwY8M",

  authDomain:
    "limi-999d5.firebaseapp.com",

  projectId:
    "limi-999d5",

  storageBucket:
    "limi-999d5.firebasestorage.app",

  messagingSenderId:
    "620745287346",

  appId:
    "1:620745287346:web:cd0b4de08b0bb81dc34bab",
};

const app =
  getApps().length > 0
    ? getApp()
    : initializeApp(
        firebaseConfig
      );

/* -------------------------------------------------------
   FIREBASE AUTH

   Explicit persistence is more predictable
   inside the Capacitor iOS WebView.
------------------------------------------------------- */

export const auth =
  initializeAuth(app, {
    persistence:
      browserLocalPersistence,
  });

export const db =
  getFirestore(app);

export const storage =
  getStorage(app);

export const googleProvider =
  new GoogleAuthProvider();

export default app;