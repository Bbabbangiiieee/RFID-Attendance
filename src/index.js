// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAlorTSQlN1-GfABuQgbUGQi5Fd3tg9T3E",
  authDomain: "test-de11b.firebaseapp.com",
  projectId: "test-de11b",
  storageBucket: "test-de11b.appspot.com",
  messagingSenderId: "731834875968",
  appId: "1:731834875968:web:939410069881f707c31fa5",
  measurementId: "G-6EDC6FST60"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
console.log(app);