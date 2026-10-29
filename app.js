
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB72sw1fEuJcPja99c02ecAby6uA8uQKxo",
  authDomain: "indian-news-d1559.firebaseapp.com",
  databaseURL: "https://indian-news-d1559-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "indian-news-d1559",
  storageBucket: "indian-news-d1559.firebasestorage.app",
  messagingSenderId: "183454992636",
  appId: "1:183454992636:web:6aa1664e4e55b80357af79",
  measurementId: "G-RE8B473YYM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
