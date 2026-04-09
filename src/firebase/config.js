import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBCvxdLo66xzHftNSKh4Tbxro9Kx1TF9iU",
  authDomain: "devverse-tracker.firebaseapp.com",
  projectId: "devverse-tracker",
  storageBucket: "devverse-tracker.firebasestorage.app",
  messagingSenderId: "803357494250",
  appId: "1:803357494250:web:7f9177f49b7621b721c093",
  measurementId: "G-04VTMCE9WL"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// ============================================================
//  ADMIN EMAIL — Change this to your email
//  This email gets access to the Admin Dashboard
// ============================================================
export const ADMIN_EMAIL = "vjysupermacy@gmail.com";
