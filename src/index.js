// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDx2ywWs3VCoW30xVUXFGc5NTzyFRdrknM",
  authDomain: "rfid-attendance-82f39.firebaseapp.com",
  projectId: "rfid-attendance-82f39",
  storageBucket: "rfid-attendance-82f39.appspot.com",
  messagingSenderId: "116622604096",
  appId: "1:116622604096:web:3a3615f542fa3fe0e66ca5",
  measurementId: "G-66SGGMTWRX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);