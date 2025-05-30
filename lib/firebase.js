// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDGTaseCoBUYP7pr2SAVEkFXVmXTQPiC-Y",
  authDomain: "rndairy-3dc5f.firebaseapp.com",
  projectId: "rndairy-3dc5f",
  storageBucket: "rndairy-3dc5f.firebasestorage.app",
  messagingSenderId: "33072645671",
  appId: "1:33072645671:web:80656d05f4fcdd79d0f002",
  measurementId: "G-36TVDEB6QP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };