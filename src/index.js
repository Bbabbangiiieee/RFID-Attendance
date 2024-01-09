// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAvI3hLtCXY2wt2ub4-HSV6RuOsQLSxn24",
  authDomain: "attendance-73f9c.firebaseapp.com",
  projectId: "attendance-73f9c",
  storageBucket: "attendance-73f9c.appspot.com",
  messagingSenderId: "604516915514",
  appId: "1:604516915514:web:3d45ba93f938d45e5ed803",
  measurementId: "G-6J7XH07YNX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
console.log(app);