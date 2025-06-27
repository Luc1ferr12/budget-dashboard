// Import firebase.js
// <script src="../firebase.js"></script> sudah diindex.html

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