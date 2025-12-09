// src/firebase/firebase.js

// Import the core functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";      // <-- ADDED: For Authentication
import { getFirestore } from "firebase/firestore"; // <-- ADDED: For Database

// Your web app's Firebase configuration (This is correct)
const firebaseConfig = {
  apiKey: "AIzaSyCNVwarS_bPV5jRipmCrvHC_An00lCNk8E",
  authDomain: "club-18636.firebaseapp.com",
  projectId: "club-18636",
  storageBucket: "club-18636.firebasestorage.app",
  messagingSenderId: "865535779352",
  appId: "1:865535779352:web:63030042d775f459f9d96d",
  measurementId: "G-5MKPEXR53S"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize and export the required services
export const auth = getAuth(app);         // <-- EXPORTED: For login, register, logout
export const db = getFirestore(app);     // <-- EXPORTED: For habits, checkins, profiles

// NOTE: You can remove the getAnalytics imports/initialization if you don't need Google Analytics:
// import { getAnalytics } from "firebase/analytics";
// const analytics = getAnalytics(app);