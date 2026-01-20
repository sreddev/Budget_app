import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase keys for this budget demo
const firebaseConfig = {
  apiKey: "AIzaSyBBqVBFL83qHORTbBFuCwFO9epiVAhDRH4",
  authDomain: "budget-17bc7.firebaseapp.com",
  projectId: "budget-17bc7",
  storageBucket: "budget-17bc7.firebasestorage.app",
  messagingSenderId: "977489489518",
  appId: "1:977489489518:web:018fe51e8719bad6e1407f",
};

// Start Firebase
const app = initializeApp(firebaseConfig);

// Firestore handle used across the app
export const db = getFirestore(app);
