// Firebase config (isi sesuai project Anda)
const firebaseConfig = {
  apiKey: "AIzaSyCtVKalCYsWX5eHfZyk005uzMElM_vreKo",
  authDomain: "data-pribadi-ac30b.firebaseapp.com",
  projectId: "data-pribadi-ac30b",
  storageBucket: "data-pribadi-ac30b.firebasestorage.app",
  messagingSenderId: "428995046107",
  appId: "1:428995046107:web:0ed23242e750a3cb2cfafe",
  measurementId: "G-98E4KP24VD"
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