import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// This is a default config. In a real app, you would use env variables.
const firebaseConfig = {
  apiKey: "AIzaSyA0Tbt16gKafumRk6TWFcSzZG8GuB3_ARY",
  authDomain: "pair-mate.firebaseapp.com",
  projectId: "pair-mate",
  storageBucket: "pair-mate.firebasestorage.app",
  messagingSenderId: "989934425215",
  appId: "1:989934425215:web:8f279a2cc88386bd45db4a"
};

import { getMessaging } from "firebase/messaging";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const messaging = getMessaging(app);
