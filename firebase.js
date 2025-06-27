// firebase.js
// Ganti konfigurasi berikut dengan config dari Firebase Console project Anda
const firebaseConfig = {
    apiKey: "AIzaSyCtVKalCYsWX5eHfZyk005uzMElM_vreKo",
    authDomain: "data-pribadi-ac30b.firebaseapp.com",
    projectId: "data-pribadi-ac30b",
    storageBucket: "data-pribadi-ac30b.firebasestorage.app",
    messagingSenderId: "428995046107",
    appId: "1:428995046107:web:0ed23242e750a3cb2cfafe",
    measurementId: "G-98E4KP24VD"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore(); 