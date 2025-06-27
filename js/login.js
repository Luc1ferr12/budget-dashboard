// Import firebase.js
// <script src="../firebase.js"></script> sudah diindex.html

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