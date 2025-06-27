// Firebase config (isi sesuai project Anda)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();

auth.onAuthStateChanged(function(user) {
  if (!user) {
    window.location.href = 'login.html';
  } else {
    document.getElementById('user-name').textContent = user.displayName || user.email;
  }
});

document.getElementById('logout-btn').addEventListener('click', function() {
  auth.signOut();
}); 