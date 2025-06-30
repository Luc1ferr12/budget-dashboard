// Dark/Light mode toggle
function setTheme(isDark) {
  if (isDark) {
    document.body.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    document.getElementById('theme-icon').textContent = '☀️';
  } else {
    document.body.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    document.getElementById('theme-icon').textContent = '🌙';
  }
}
// Set initial theme
const savedTheme = localStorage.getItem('theme');
setTheme(savedTheme === 'dark');
// Tampilkan body setelah theme di-set
document.body.classList.remove('hide');
// Toggle theme
document.getElementById('theme-toggle-btn').onclick = function() {
  setTheme(!document.body.classList.contains('dark'));
};

// Ambil data user dari Firebase Auth dan tampilkan di form
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    document.getElementById('display-name').value = user.displayName || '';
    document.getElementById('email').value = user.email || '';
    // Ambil location dari Firestore jika ada
    firebase.firestore().collection('users').doc(user.uid).get().then(docSnap => {
      if (docSnap.exists && docSnap.data().location) {
        document.getElementById('location').value = docSnap.data().location;
      }
    });
    // Ambil currency & language
    firebase.firestore().collection('users').doc(user.uid).get().then(docSnap => {
      if (docSnap.exists) {
        const data = docSnap.data();
        if (data.currency) document.getElementById('currency').value = data.currency;
        if (data.language) document.getElementById('language').value = data.language;
      }
    });
  }
});

// Simpan perubahan display name, location, dan currency & language
const accountForm = document.getElementById('account-info-form');
if (accountForm) {
  accountForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const displayName = document.getElementById('display-name').value.trim();
    const location = document.getElementById('location').value;
    const user = firebase.auth().currentUser;
    if (!user) return;
    // Update displayName di Firebase Auth
    user.updateProfile({ displayName }).then(() => {
      // Update location di Firestore
      return firebase.firestore().collection('users').doc(user.uid).set({ location }, { merge: true });
    }).then(() => {
      alert('Perubahan berhasil disimpan!');
    }).catch(err => {
      alert('Gagal menyimpan perubahan: ' + err.message);
    });
  });
}

const appPrefForm = document.getElementById('app-preferences-form');
if (appPrefForm) {
  appPrefForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const currency = document.getElementById('currency').value;
    const language = document.getElementById('language').value;
    const user = firebase.auth().currentUser;
    if (!user) return;
    firebase.firestore().collection('users').doc(user.uid).set({ currency, language }, { merge: true })
      .then(() => {
        alert('Preferences berhasil disimpan!');
      })
      .catch(err => {
        alert('Gagal menyimpan preferences: ' + err.message);
      });
  });
} 