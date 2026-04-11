import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBZ_J5HdkaIT45Xmi24xM3bnocfSNHWnzY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tesjul-e0ed0.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tesjul-e0ed0",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "tesjul-e0ed0.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "486221919542",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:486221919542:web:786fbf8e6ccdb3458baf97",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-QSTVE5N3MG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup };