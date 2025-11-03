import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBj-LbMe9xu1W_fZrvAAjLCOIqcLnuPaJQ",
    authDomain: "lolopdf-881c6.firebaseapp.com",
    projectId: "lolopdf-881c6",
    storageBucket: "lolopdf-881c6.appspot.com",
    messagingSenderId: "308767461245",
    appId: "1:308767461245:web:1523a8bf59232572fc0614",
    measurementId: "G-T633T64M9G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();