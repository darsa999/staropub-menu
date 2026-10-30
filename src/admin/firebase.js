import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Firebase web config is public by design; restrict the API key by HTTP referrer
// in Google Cloud Console. Values can be overridden per environment via VITE_FIREBASE_*.
const env = import.meta.env;
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyBItCODkqjOBCSTHQLst_zimOnsrYcPUGo",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "staropub-menu.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "staropub-menu",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "staropub-menu.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "211658818022",
  appId: env.VITE_FIREBASE_APP_ID || "1:211658818022:web:e944e70d38b71515b25627",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider, signInWithPopup };
