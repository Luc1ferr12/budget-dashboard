document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('add-bank-form');
  const input = document.getElementById('bank-name');
  const list = document.getElementById('bank-list');

  let currentUser = null;

  // Render bank list dari Firestore
  function renderBanks(banks) {
    list.innerHTML = '';
    // Ambil bankBalances dari localStorage (atau object kosong)
    const bankBalances = JSON.parse(localStorage.getItem('bankBalances') || '{}');
    if (!banks || banks.length === 0) {
      list.innerHTML = '<div class="no-banks-list">No banks added yet.</div>';
      return;
    }
    banks.forEach((bank, idx) => {
      const balance = bankBalances[bank] || 0;
      const isDisabled = balance > 0;
      const btnTitle = isDisabled ? 'Tidak bisa dihapus, masih ada balance' : 'Delete';
      const btnDisabled = isDisabled ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : '';
      const div = document.createElement('div');
      div.className = 'bank-item';
      div.innerHTML = `<span>${bank}</span> <button class="remove-btn" data-idx="${idx}" title="${btnTitle}" ${btnDisabled}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6"/><path d="M19 6l-1.5 14a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg></button>`;
      list.appendChild(div);
    });
  }

  // Ambil dan pantau data bank user dari Firestore
  function listenBanks(user) {
    db.collection('users').doc(user.uid).onSnapshot(doc => {
      const data = doc.data() || {};
      renderBanks(data.banks || []);
    });
  }

  // Tambah bank ke Firestore
  function addBank(user, name) {
    const userRef = db.collection('users').doc(user.uid);
    userRef.get().then(docSnap => {
      let banks = (docSnap.exists && docSnap.data().banks) ? docSnap.data().banks : [];
      if (banks.includes(name)) return;
      banks.push(name);
      userRef.set({ banks }, { merge: true });
    });
  }

  // Hapus bank dari Firestore
  function removeBank(user, idx) {
    const userRef = db.collection('users').doc(user.uid);
    userRef.get().then(docSnap => {
      let banks = (docSnap.exists && docSnap.data().banks) ? docSnap.data().banks : [];
      banks.splice(idx, 1);
      userRef.set({ banks }, { merge: true });
    });
  }

  // Tunggu user login
  firebase.auth().onAuthStateChanged(function(user) {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }
    currentUser = user;
    listenBanks(user);
  });

  // Tambah bank
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = input.value.trim();
    if (!name || !currentUser) return;
    addBank(currentUser, name);
    input.value = '';
  });

  // Hapus bank
  list.addEventListener('click', function(e) {
    const btn = e.target.closest('.remove-btn');
    if (btn && !btn.hasAttribute('disabled')) {
      const idx = +btn.getAttribute('data-idx');
      if (currentUser) removeBank(currentUser, idx);
    }
  });
}); 