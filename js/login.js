// Firebase config (isi sesuai project Anda)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

document.getElementById('google-login').addEventListener('click', function() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then((result) => {
      window.location.href = 'index.html';
    })
    .catch((error) => {
      alert('Login failed: ' + error.message);
    });
});

auth.onAuthStateChanged(function(user) {
  if (user) {
    window.location.href = 'index.html';
  }
}); 