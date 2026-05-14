import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; 

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "ambro-zone.firebaseapp.com",
  projectId: "ambro-zone",
  storageBucket: "ambro-zone.firebasestorage.app",
  messagingSenderId: "1048138256415",
  appId: "1:1048138256415:web:336d04a5f5be8b78d2c52a"
};
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);