// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage"
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAUeHEX-cSSpwAOSHhAFV9lzWF3YUVVzNc",
  authDomain: "resiliencehubapp.firebaseapp.com",
  projectId: "resiliencehubapp",
  storageBucket: "resiliencehubapp.firebasestorage.app",
  messagingSenderId: "1089942836343",
  appId: "1:1089942836343:web:e8bf0e00c5143ac7346272"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
})

export {app, auth, db}