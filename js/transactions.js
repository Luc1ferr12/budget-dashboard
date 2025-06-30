document.addEventListener('DOMContentLoaded', function() {
  let currentEditId = null;
  // Hapus class hide dari body
  document.body.classList.remove('hide');
  
  // Cek user login
  firebase.auth().onAuthStateChanged(function(user) {
    if (!user) {
      window.location.href = 'login.html';
    } else {
      renderIncomeTable();
      renderDetailTable();
      renderSavingTable();
      renderExpensesTable();
      // Pastikan renderDetailTable juga dipanggil ulang setiap 2 detik (polling) agar sync jika ada perubahan
      setInterval(renderDetailTable, 2000);
    }
  });

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      firebase.auth().signOut();
    });
  }
  // Tambahkan event listener untuk tombol logout di bottom-navbar (ponsel)
  const navLogout = document.querySelector('.nav-logout');
  if (navLogout) {
    navLogout.addEventListener('click', function(e) {
      e.preventDefault();
      firebase.auth().signOut();
    });
  }

  // Dark/Light mode toggle
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeIcon = document.getElementById('theme-icon');
  function setTheme(isDark) {
    if (isDark) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      if (themeIcon) themeIcon.textContent = '☀️';
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      if (themeIcon) themeIcon.textContent = '🌙';
    }
  }
  // Set initial theme
  let savedTheme = localStorage.getItem('theme');
  let isDark = savedTheme === 'dark';
  if (!savedTheme) {
    isDark = true;
    localStorage.setItem('theme', 'dark');
  }
  setTheme(isDark);
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function() {
      const dark = !document.body.classList.contains('dark');
      setTheme(dark);
    });
  }

  // Add Income Modal
  const addIncomeBtn = document.querySelector('.add-income-btn');
  const addIncomeModal = document.getElementById('add-income-modal');
  const closeIncomeModal = document.getElementById('close-income-modal');
  const cancelIncome = document.getElementById('cancel-income');
  const addIncomeForm = document.getElementById('add-income-form');
  const addCategoryBtn = document.getElementById('add-category-btn');
  const addAccountBtn = document.getElementById('add-account-btn');

  // Add Expenses Modal
  const addExpensesBtn = document.querySelector('.add-expenses-btn');
  const addExpensesModal = document.getElementById('add-expenses-modal');
  const closeExpensesModalBtn = document.getElementById('close-expenses-modal');
  const cancelExpenses = document.getElementById('cancel-expenses');
  const addExpensesForm = document.getElementById('add-expenses-form');
  const addExpensesCategoryBtn = document.getElementById('add-expenses-category-btn');
  const addExpensesAccountBtn = document.getElementById('add-expenses-account-btn');

  // Add Saving Modal
  const addSavingBtn = document.querySelector('.add-savings-btn');
  const addSavingModal = document.getElementById('add-saving-modal');
  const closeSavingModal = document.getElementById('close-saving-modal');
  const cancelSaving = document.getElementById('cancel-saving');
  const addSavingForm = document.getElementById('add-saving-form');
  const savingCategory = document.getElementById('saving-category');
  const savingDynamicFields = document.getElementById('saving-dynamic-fields');

  // Transfer Balance Modal
  const transferBalanceBtn = document.querySelector('.transfer-balance-btn');

  // Open modal
  if (addIncomeBtn) {
    addIncomeBtn.addEventListener('click', function() {
      addIncomeModal.style.display = 'block';
      document.body.style.overflow = '';
      loadAccounts();
      loadCategories();
      
      // Set tanggal default ke hari ini
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('income-date').value = today;
    });
  }

  // Open Expenses modal
  if (addExpensesBtn) {
    addExpensesBtn.addEventListener('click', function() {
      addExpensesModal.style.display = 'block';
      document.body.style.overflow = '';
      loadExpensesAccounts();
      loadExpensesCategories();
      
      // Set tanggal default ke hari ini
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('expenses-date').value = today;
    });
  }

  // Open Saving modal
  if (addSavingBtn) {
    addSavingBtn.addEventListener('click', function() {
      addSavingModal.style.display = 'block';
      document.body.style.overflow = '';
      addSavingForm.reset();
      savingDynamicFields.innerHTML = '';
      
      // Set tanggal default ke hari ini
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('saving-date').value = today;
    });
  }

  // Open Transfer Balance modal
  if (transferBalanceBtn) {
    transferBalanceBtn.addEventListener('click', function() {
      // Buka modal Transfer Balance yang baru
      const transferBalanceModal = document.getElementById('transfer-balance-modal');
      transferBalanceModal.style.display = 'block';
      document.body.style.overflow = '';
      document.getElementById('transfer-balance-form').reset();
      document.getElementById('transfer-dynamic-fields').innerHTML = '';
      document.getElementById('balance-info').style.display = 'none';
      
      // Set tanggal default ke hari ini
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('transfer-date').value = today;
    });
  }

  // Close modal functions
  function closeModal() {
    addIncomeModal.style.display = 'none';
    document.body.style.overflow = '';
    addIncomeForm.reset();
  }

  function closeExpensesModal() {
    addExpensesModal.style.display = 'none';
    document.body.style.overflow = '';
    addExpensesForm.reset();
  }

  function closeSaving() {
    addSavingModal.style.display = 'none';
    document.body.style.overflow = '';
    addSavingForm.reset();
    savingDynamicFields.innerHTML = '';
  }

  function closeTransferBalance() {
    const transferBalanceModal = document.getElementById('transfer-balance-modal');
    transferBalanceModal.style.display = 'none';
    document.body.style.overflow = '';
    document.getElementById('transfer-balance-form').reset();
    document.getElementById('transfer-dynamic-fields').innerHTML = '';
    document.getElementById('balance-info').style.display = 'none';
  }

  if (closeIncomeModal) {
    closeIncomeModal.addEventListener('click', closeModal);
  }

  if (cancelIncome) {
    cancelIncome.addEventListener('click', closeModal);
  }

  if (closeExpensesModalBtn) {
    closeExpensesModalBtn.addEventListener('click', closeExpensesModal);
  }

  if (cancelExpenses) {
    cancelExpenses.addEventListener('click', closeExpensesModal);
  }

  if (closeSavingModal) closeSavingModal.addEventListener('click', closeSaving);
  if (cancelSaving) cancelSaving.addEventListener('click', closeSaving);

  // Transfer Balance modal close buttons
  const closeTransferBalanceModal = document.getElementById('close-transfer-balance-modal');
  const cancelTransferBalance = document.getElementById('cancel-transfer-balance');
  
  if (closeTransferBalanceModal) {
    closeTransferBalanceModal.addEventListener('click', closeTransferBalance);
  }
  
  if (cancelTransferBalance) {
    cancelTransferBalance.addEventListener('click', closeTransferBalance);
  }

  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === addIncomeModal) {
      closeModal();
    }
    if (event.target === addExpensesModal) {
      closeExpensesModal();
    }
    if (event.target === addSavingModal) closeSaving();
    if (event.target === document.getElementById('transfer-balance-modal')) {
      closeTransferBalance();
    }
  });

  // Add Account button
  if (addAccountBtn) {
    addAccountBtn.addEventListener('click', function() {
      window.location.href = 'add-bank.html';
    });
  }

  // Add Expenses Account button
  if (addExpensesAccountBtn) {
    addExpensesAccountBtn.addEventListener('click', function() {
      window.location.href = 'add-bank.html';
    });
  }

  // Load accounts from user doc array 'banks'
  async function loadAccounts() {
    try {
      const user = firebase.auth().currentUser;
      if (!user) return;

      const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
      const data = userDoc.data();
      const banks = data && data.banks ? data.banks : [];

      const accountSelect = document.getElementById('income-account');
      accountSelect.innerHTML = '<option value="">Select account</option>';
      
      banks.forEach(bank => {
        const option = document.createElement('option');
        option.value = bank;
        option.textContent = bank;
        accountSelect.appendChild(option);
      });
      console.log('Loaded banks from user doc:', banks);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  }

  // Load expenses accounts from user doc array 'banks'
  async function loadExpensesAccounts() {
    try {
      const user = firebase.auth().currentUser;
      if (!user) return;

      const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
      const data = userDoc.data();
      const banks = data && data.banks ? data.banks : [];

      const accountSelect = document.getElementById('expenses-account');
      accountSelect.innerHTML = '<option value="">Select account</option>';
      
      banks.forEach(bank => {
        const option = document.createElement('option');
        option.value = bank;
        option.textContent = bank;
        accountSelect.appendChild(option);
      });
      console.log('Loaded banks for expenses from user doc:', banks);
    } catch (error) {
      console.error('Error loading expenses accounts:', error);
    }
  }

  // Load categories from Firestore
  async function loadCategories() {
    try {
      const user = firebase.auth().currentUser;
      if (!user) return;

      const categoriesRef = firebase.firestore().collection('users').doc(user.uid).collection('categories');
      const snapshot = await categoriesRef.where('type', '==', 'income').get();
      
      const categorySelect = document.getElementById('income-category');
      categorySelect.innerHTML = '<option value="">Select category</option>';
      
      snapshot.forEach(doc => {
        const category = doc.data();
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        categorySelect.appendChild(option);
      });
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  // Load expenses categories from Firestore
  async function loadExpensesCategories() {
    try {
      const user = firebase.auth().currentUser;
      if (!user) return;

      const categoriesRef = firebase.firestore().collection('users').doc(user.uid).collection('categories');
      const snapshot = await categoriesRef.where('type', '==', 'expenses').get();
      
      const categorySelect = document.getElementById('expenses-category');
      categorySelect.innerHTML = '<option value="">Select category</option>';
      
      snapshot.forEach(doc => {
        const category = doc.data();
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        categorySelect.appendChild(option);
      });
    } catch (error) {
      console.error('Error loading expenses categories:', error);
    }
  }

  // Add new category to Firestore
  async function addCategory(categoryName) {
    try {
      const user = firebase.auth().currentUser;
      if (!user) return;

      const categoriesRef = firebase.firestore().collection('users').doc(user.uid).collection('categories');
      await categoriesRef.add({
        name: categoryName,
        type: 'income',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Reload categories
      loadCategories();
      alert('Category added successfully!');
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Error adding category. Please try again.');
    }
  }

  // Handle form submission
  if (addIncomeForm) {
    addIncomeForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(addIncomeForm);
      const incomeData = {
        date: formData.get('date'),
        amount: parseFloat(formData.get('amount')),
        category: formData.get('category'),
        account: formData.get('account'),
        type: 'income',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      try {
        const user = firebase.auth().currentUser;
        if (!user) return;

        const transactionsRef = firebase.firestore().collection('users').doc(user.uid).collection('transactions');
        await transactionsRef.add(incomeData);

        alert('Income added successfully!');
        await syncAllBalances();
        closeModal();
        renderDetailTable();
        renderIncomeTable();
        renderTransferedTable();
      } catch (error) {
        console.error('Error adding income:', error);
        alert('Error adding income. Please try again.');
      }
    });
  }

  // Handle Saving form submission
  if (addSavingForm) {
    addSavingForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(addSavingForm);
      const category = formData.get('category');
      let savingData = {
        date: formData.get('date'),
        amount: parseFloat(formData.get('amount')),
        category: category,
        type: 'saving',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      // Tambahkan field sesuai kategori
      if (category === 'bank-bank') {
        savingData.account_from = formData.get('account_from');
        savingData.account_to = formData.get('account_to');
        savingData.account = `${formData.get('account_from')} → ${formData.get('account_to')}`;
      } else if (category === 'bank-invest') {
        savingData.account_from = formData.get('account_from');
        savingData.invest_to = formData.get('invest_to');
        savingData.account = `${formData.get('account_from')} → ${formData.get('invest_to')}`;
      } else if (category === 'invest-bank') {
        savingData.invest_from = formData.get('invest_from');
        savingData.account_to = formData.get('account_to');
        savingData.account = `${formData.get('invest_from')} → ${formData.get('account_to')}`;
      } else if (category === 'invest-invest') {
        savingData.invest_from = formData.get('invest_from');
        savingData.invest_to = formData.get('invest_to');
        savingData.account = `${formData.get('invest_from')} → ${formData.get('invest_to')}`;
      }

      try {
        const user = firebase.auth().currentUser;
        if (!user) return;

        const transactionsRef = firebase.firestore().collection('users').doc(user.uid).collection('transactions');
        await transactionsRef.add(savingData);

        alert('Saving added successfully!');
        await syncAllBalances();
        closeSaving();
        renderDetailTable();
        renderSavingTable();
        renderTransferedTable();
      } catch (error) {
        console.error('Error adding saving:', error);
        alert('Error adding saving. Please try again.');
      }
    });
  }

  // Handle expenses form submission
  if (addExpensesForm) {
    addExpensesForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(addExpensesForm);
      const expensesData = {
        date: formData.get('date'),
        amount: parseFloat(formData.get('amount')),
        category: formData.get('category'),
        account: formData.get('account'),
        type: 'expenses',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      try {
        const user = firebase.auth().currentUser;
        if (!user) return;

        const transactionsRef = firebase.firestore().collection('users').doc(user.uid).collection('transactions');
        await transactionsRef.add(expensesData);

        alert('Expenses added successfully!');
        await syncAllBalances();
        closeExpensesModal();
        renderDetailTable();
        renderExpensesTable();
        renderTransferedTable();
      } catch (error) {
        console.error('Error adding expenses:', error);
        alert('Error adding expenses. Please try again.');
      }
    });
  }

  // Handle Transfer Balance form submission
  const transferBalanceForm = document.getElementById('transfer-balance-form');
  if (transferBalanceForm) {
    transferBalanceForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(transferBalanceForm);
      const category = formData.get('category');
      const amount = parseFloat(formData.get('amount'));
      let transferData = {
        date: formData.get('date'),
        amount: amount,
        category: category,
        type: 'transfer', // Ubah dari 'saving' ke 'transfer'
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      // Validasi amount tidak melebihi balance
      let sourceType = '';
      let sourceName = '';
      
      if (category === 'bank-bank' || category === 'bank-invest') {
        sourceType = 'bank';
        sourceName = formData.get('account_from');
      } else if (category === 'invest-bank' || category === 'invest-invest') {
        sourceType = 'invest';
        sourceName = formData.get('invest_from');
      }
      
      // Validasi semua field terisi
      if (!sourceName) {
        alert('Please select source account/investment!');
        return;
      }
      
      // Validasi destination field
      let destinationName = '';
      if (category === 'bank-bank') {
        destinationName = formData.get('account_to');
      } else if (category === 'bank-invest') {
        destinationName = formData.get('invest_to');
      } else if (category === 'invest-bank') {
        destinationName = formData.get('account_to');
      } else if (category === 'invest-invest') {
        destinationName = formData.get('invest_to');
      }
      
      if (!destinationName) {
        alert('Please select destination account/investment!');
        return;
      }
      
      // Validasi source dan destination tidak sama
      if (sourceName === destinationName) {
        alert('Source and destination cannot be the same!');
        return;
      }
      
      if (amount <= 0) {
        alert('Amount must be greater than 0!');
        return;
      }
      
      if (sourceName) {
        let availableBalance = 0;
        
        if (sourceType === 'bank') {
          const bankBalances = JSON.parse(localStorage.getItem('bankBalances') || '{}');
          availableBalance = bankBalances[sourceName] || 0;
        } else if (sourceType === 'invest') {
          const investBalances = JSON.parse(localStorage.getItem('investBalances') || '{}');
          availableBalance = investBalances[sourceName] || 0;
        }
        
        if (amount > availableBalance) {
          alert(`Insufficient balance! Available balance in ${sourceName}: ${availableBalance}`);
          return;
        }
      }

      // Tambahkan field sesuai kategori
      if (category === 'bank-bank') {
        transferData.account_from = formData.get('account_from');
        transferData.account_to = formData.get('account_to');
        transferData.account = `${formData.get('account_from')} → ${formData.get('account_to')}`;
      } else if (category === 'bank-invest') {
        transferData.account_from = formData.get('account_from');
        transferData.invest_to = formData.get('invest_to');
        transferData.account = `${formData.get('account_from')} → ${formData.get('invest_to')}`;
      } else if (category === 'invest-bank') {
        transferData.invest_from = formData.get('invest_from');
        transferData.account_to = formData.get('account_to');
        transferData.account = `${formData.get('invest_from')} → ${formData.get('account_to')}`;
      } else if (category === 'invest-invest') {
        transferData.invest_from = formData.get('invest_from');
        transferData.invest_to = formData.get('invest_to');
        transferData.account = `${formData.get('invest_from')} → ${formData.get('invest_to')}`;
      }

      try {
        const user = firebase.auth().currentUser;
        if (!user) return;

        const transactionsRef = firebase.firestore().collection('users').doc(user.uid).collection('transactions');
        await transactionsRef.add(transferData);

        alert('Transfer Balance added successfully!');
        await syncAllBalances();
        closeTransferBalance();
        renderDetailTable();
        renderSavingTable();
        renderTransferedTable();
      } catch (error) {
        console.error('Error adding transfer balance:', error);
        alert('Error adding transfer balance. Please try again.');
      }
    });
  }

  // Add Category Modal Logic
  const categoryModal = document.getElementById('category-modal');
  const openCategoryModalBtn = document.getElementById('add-category-btn');
  const closeCategoryModalBtn = document.getElementById('close-category-modal');
  const addCategoryForm = document.getElementById('add-category-form');
  const newCategoryInput = document.getElementById('new-category-input');
  const categoryList = document.getElementById('category-list');

  // Add Expenses Category Modal Logic
  const expensesCategoryModal = document.getElementById('expenses-category-modal');
  const openExpensesCategoryModalBtn = document.getElementById('add-expenses-category-btn');
  const closeExpensesCategoryModalBtn = document.getElementById('close-expenses-category-modal');
  const addExpensesCategoryForm = document.getElementById('add-expenses-category-form');
  const newExpensesCategoryInput = document.getElementById('new-expenses-category-input');
  const expensesCategoryList = document.getElementById('expenses-category-list');

  // Deklarasi renderCategoryList lebih awal agar tidak ReferenceError
  async function renderCategoryList() {
    categoryList.innerHTML = '<li style="text-align:center;color:var(--text-secondary);font-style:italic;">Loading...</li>';
    try {
      const user = firebase.auth().currentUser;
      if (!user) return;
      const categoriesRef = firebase.firestore().collection('users').doc(user.uid).collection('categories');
      const snapshot = await categoriesRef.where('type', '==', 'income').get();
      // Ambil semua transaksi income (tanpa filter tanggal)
      const transactionsRef = firebase.firestore().collection('users').doc(user.uid).collection('transactions');
      const trxSnap = await transactionsRef
        .where('type', '==', 'income')
        .get();
      const trxs = [];
      trxSnap.forEach(doc => trxs.push({ ...doc.data(), id: doc.id }));
      if (snapshot.empty) {
        categoryList.innerHTML = '<li style="text-align:center;color:var(--text-secondary);font-style:italic;">No categories yet</li>';
        renderIncomeTable();
        renderDetailTable();
        renderSavingTable();
        renderExpensesTable();
        return;
      }
      categoryList.innerHTML = '';
      snapshot.forEach(doc => {
        const category = doc.data();
        // Cek apakah kategori ini dipakai di transaksi
        const used = trxs.some(t => t.category === category.name);
        const li = document.createElement('li');
        li.dataset.id = doc.id;
        li.innerHTML = `
          <span class="cat-name">${category.name}</span>
          <span class="category-actions">
            <button class="category-action-btn edit" title="Edit"><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            <button class="category-action-btn save" title="Save" style="display:none;"><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></button>
            <button class="category-action-btn delete" title="Delete" ${used ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3,6 5,6 21,6"/><path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
          </span>
        `;
        categoryList.appendChild(li);
      });
      renderIncomeTable();
      renderDetailTable();
      renderSavingTable();
      renderExpensesTable();
      addCategoryListListeners();
    } catch (error) {
      categoryList.innerHTML = '<li style="text-align:center;color:red;">Error loading categories<br>'+error+'</li>';
      renderIncomeTable();
      renderDetailTable();
      renderSavingTable();
      renderExpensesTable();
    }
  }

  // Deklarasi addCategoryListListeners setelah renderCategoryList
  function addCategoryListListeners() {
    categoryList.querySelectorAll('.edit').forEach(btn => {
      btn.addEventListener('click', function() {
        const li = btn.closest('li');
        const nameSpan = li.querySelector('.cat-name');
        const saveBtn = li.querySelector('.save');
        btn.style.display = 'none';
        saveBtn.style.display = '';
        const input = document.createElement('input');
        input.type = 'text';
        input.value = nameSpan.textContent;
        input.className = 'edit-input';
        nameSpan.replaceWith(input);
        input.focus();
      });
    });
    categoryList.querySelectorAll('.save').forEach(btn => {
      btn.addEventListener('click', async function() {
        const li = btn.closest('li');
        const input = li.querySelector('input.edit-input');
        const newName = input.value.trim();
        if (!newName) return;
        const id = li.dataset.id;
        try {
          const user = firebase.auth().currentUser;
          if (!user) return;
          const categoriesRef = firebase.firestore().collection('users').doc(user.uid).collection('categories');
          await categoriesRef.doc(id).update({ name: newName });
          renderCategoryList();
          loadCategories();
        } catch (error) {
          alert('Error saving category');
        }
      });
    });
    categoryList.querySelectorAll('.delete').forEach(btn => {
      btn.addEventListener('click', async function() {
        if (!confirm('Delete this category?')) return;
        const li = btn.closest('li');
        const id = li.dataset.id;
        try {
          const user = firebase.auth().currentUser;
          if (!user) return;
          const categoriesRef = firebase.firestore().collection('users').doc(user.uid).collection('categories');
          await categoriesRef.doc(id).delete();
          renderCategoryList();
          loadCategories();
        } catch (error) {
          alert('Error deleting category');
        }
      });
    });
  }

  // Open modal
  if (openCategoryModalBtn) {
    openCategoryModalBtn.addEventListener('click', function(e) {
      e.preventDefault();
      categoryModal.style.display = 'block';
      document.body.style.overflow = 'hidden';
      renderCategoryList();
    });
  }

  // Close modal
  function closeCategoryModal() {
    categoryModal.style.display = 'none';
    document.body.style.overflow = '';
    addCategoryForm.reset();
  }
  if (closeCategoryModalBtn) {
    closeCategoryModalBtn.addEventListener('click', closeCategoryModal);
  }
  window.addEventListener('click', function(event) {
    if (event.target === categoryModal) {
      closeCategoryModal();
    }
  });

  // Tambah kategori baru
  if (addCategoryForm) {
    addCategoryForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const name = newCategoryInput.value.trim();
      if (!name) return;
      try {
        const user = firebase.auth().currentUser;
        if (!user) return;
        const categoriesRef = firebase.firestore().collection('users').doc(user.uid).collection('categories');
        await categoriesRef.add({
          name,
          type: 'income',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        newCategoryInput.value = '';
        renderCategoryList();
        loadCategories(); // update dropdown
      } catch (error) {
        alert('Error adding category');
      }
    });
  }

  // Render tabel Income
  async function renderIncomeTable() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const incomeTable = document.querySelector('.trx-section.income .transactions-table');
    if (!incomeTable) return;

    // Ambil kategori income
    const categoriesRef = firebase.firestore().collection('users').doc(user.uid).collection('categories');
    const catSnap = await categoriesRef.where('type', '==', 'income').get();
    const categories = [];
    catSnap.forEach(doc => categories.push({ id: doc.id, name: doc.data().name }));

    // Ambil semua transaksi income (tanpa filter tanggal)
    const transactionsRef = firebase.firestore().collection('users').doc(user.uid).collection('transactions');
    const trxSnap = await transactionsRef
      .where('type', '==', 'income')
      .get();
    const trxs = [];
    trxSnap.forEach(doc => trxs.push({ ...doc.data(), id: doc.id }));

    // Buat header
    let thead = `<tr><th>Category</th>`;
    months.forEach(m => thead += `<th>${m}</th>`);
    thead += `</tr>`;
    incomeTable.querySelector('thead').innerHTML = thead;

    // Buat body
    let tbody = '';
    if (categories.length === 0) {
      tbody = `<tr><td colspan="13" class="no-data">No data yet</td></tr>`;
    } else {
      categories.forEach(cat => {
        tbody += `<tr><td>${cat.name}</td>`;
        for (let i = 0; i < 12; i++) {
          // Cari transaksi pada kategori dan bulan ini
          const found = trxs.find(t => t.category === cat.name && new Date(t.date instanceof Date ? t.date : (t.date && t.date.toDate ? t.date.toDate() : t.date)).getMonth() === i);
          tbody += `<td class="currency-amount">${found ? 'Rp ' + found.amount.toLocaleString('id-ID') : ''}</td>`;
        }
        tbody += `</tr>`;
      });
    }
    incomeTable.querySelector('tbody').innerHTML = tbody;

    // Buat footer total
    let totalPerMonth = Array(12).fill(0);
    trxs.forEach(t => {
      const d = t.date instanceof Date ? t.date : (t.date && t.date.toDate ? t.date.toDate() : t.date);
      const m = new Date(d).getMonth();
      totalPerMonth[m] += t.amount;
    });
    let tfoot = `<tr><td><strong>Total</strong></td>`;
    totalPerMonth.forEach(val => tfoot += `<td class="currency-amount">${val ? 'Rp ' + val.toLocaleString('id-ID') : 'Rp 0'}</td>`);
    tfoot += `</tr>`;
    incomeTable.querySelector('tfoot').innerHTML = tfoot;
  }

  // Render tabel Detail (semua tipe transaksi)
  async function renderDetailTable() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    const detailTable = document.querySelector('.trx-section.detail .transactions-table');
    if (!detailTable) return;

    // Ambil semua transaksi
    const transactionsRef = firebase.firestore().collection('users').doc(user.uid).collection('transactions');
    const trxSnap = await transactionsRef.get();
    const trxs = [];
    trxSnap.forEach(doc => trxs.push({ ...doc.data(), id: doc.id }));

    // Set header tabel detail
    detailTable.querySelector('thead').innerHTML = `<tr>
      <th>Date</th>
      <th>Type</th>
      <th>Account</th>
      <th>Category</th>
      <th>Amount</th>
      <th>Actions</th>
    </tr>`;

    let tbody = '';
    if (trxs.length === 0) {
      tbody = `<tr><td colspan="6" class="no-data">No data yet</td></tr>`;
    } else {
      trxs.forEach((t, idx) => {
        const d = t.date instanceof Date ? t.date : (t.date && t.date.toDate ? t.date.toDate() : t.date);
        const dateStr = d ? new Date(d).toLocaleDateString('id-ID') : '';
        const rowId = t.id || t._id || t.docId || t.doc_id || t.key || t.uid || t.transactionId || t.trxId || t.trx_id || t.ref || t.refId || '';
        const isTransfer = t.type === 'transfer';
        tbody += `<tr data-trx-idx="${idx}" data-trx-id="${t.id || ''}">
          <td>${dateStr}</td>
          <td><span class="type-badge ${t.type}">${t.type || '-'}</span></td>
          <td>${t.account || '-'}</td>
          <td>${t.category || '-'}</td>
          <td class="currency-amount">${t.amount ? 'Rp ' + t.amount.toLocaleString('id-ID') : 'Rp 0'}</td>
          <td>
            <button class="action-btn edit-btn" title="Edit" ${isTransfer ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            <button class="action-btn save-btn" title="Save" style="display:none;"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></button>
            <button class="action-btn delete-btn" title="Delete"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3,6 5,6 21,6"/><path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
          </td>
        </tr>`;
      });
    }
    detailTable.querySelector('tbody').innerHTML = tbody;

    // Edit Transaction Modal logic
    const editTransactionModal = document.getElementById('edit-transaction-modal');
    const closeEditTransactionModal = document.getElementById('close-edit-transaction-modal');
    const cancelEditTransaction = document.getElementById('cancel-edit-transaction');
    const editTransactionForm = document.getElementById('edit-transaction-form');

    function openEditModal(trx) {
      editTransactionModal.style.display = 'block';
      document.body.style.overflow = 'hidden';
      document.getElementById('edit-date').value = trx.date ? formatDateForInput(trx.date instanceof Date ? trx.date : (trx.date && trx.date.toDate ? trx.date.toDate() : trx.date)) : '';
      document.getElementById('edit-type').value = trx.type || 'income';
      document.getElementById('edit-amount').value = trx.amount || '';
      loadEditModalDropdowns(trx.type || 'income', trx.account || '', trx.category || '', trx);
    }
    function closeEditModal() {
      editTransactionModal.style.display = 'none';
      document.body.style.overflow = '';
      editTransactionForm.reset();
      document.getElementById('edit-dynamic-fields').innerHTML = '';
    }
    if (closeEditTransactionModal) closeEditTransactionModal.addEventListener('click', closeEditModal);
    if (cancelEditTransaction) cancelEditTransaction.addEventListener('click', closeEditModal);
    window.addEventListener('click', function(event) {
      if (event.target === editTransactionModal) closeEditModal();
    });

    // Handle submit edit transaction
    if (editTransactionForm) {
      editTransactionForm.onsubmit = async function(e) {
        e.preventDefault();
        if (!currentEditId) return;
        const formData = new FormData(editTransactionForm);
        const type = formData.get('type');
        let newData = {
          date: formData.get('date'),
          type: type,
          amount: parseFloat(formData.get('amount'))
        };

        // Handle data sesuai tipe
        if (type === 'saving') {
          const category = formData.get('category');
          newData.category = category;
          
          // Tambahkan field sesuai kategori
          if (category === 'bank-bank') {
            newData.account_from = formData.get('account_from');
            newData.account_to = formData.get('account_to');
            newData.account = `${formData.get('account_from')} → ${formData.get('account_to')}`;
          } else if (category === 'bank-invest') {
            newData.account_from = formData.get('account_from');
            newData.invest_to = formData.get('invest_to');
            newData.account = `${formData.get('account_from')} → ${formData.get('invest_to')}`;
          } else if (category === 'invest-bank') {
            newData.invest_from = formData.get('invest_from');
            newData.account_to = formData.get('account_to');
            newData.account = `${formData.get('invest_from')} → ${formData.get('account_to')}`;
          } else if (category === 'invest-invest') {
            newData.invest_from = formData.get('invest_from');
            newData.invest_to = formData.get('invest_to');
            newData.account = `${formData.get('invest_from')} → ${formData.get('invest_to')}`;
          }
        } else {
          // Untuk income dan expenses
          newData.account = formData.get('account');
          newData.category = formData.get('category');
        }

        try {
          const user = firebase.auth().currentUser;
          if (!user) return;
          const trxRef = firebase.firestore().collection('users').doc(user.uid).collection('transactions');
          await trxRef.doc(currentEditId).update(newData);
          closeEditModal();
          await syncAllBalances();
          renderDetailTable();
          renderIncomeTable();
          renderSavingTable();
          renderExpensesTable();
          renderTransferedTable();
        } catch (err) {
          alert('Error saving transaction');
        }
      };
    }

    // Event listener tombol edit/save/delete
    detailTable.querySelectorAll('.edit-btn').forEach((btn, idx) => {
      btn.addEventListener('click', function() {
        const tr = btn.closest('tr');
        const id = getTransactionId(tr, idx);
        const trx = trxs[idx];
        currentEditId = id;
        openEditModal(trx);
      });
    });
    detailTable.querySelectorAll('.save-btn').forEach((btn, idx) => {
      btn.addEventListener('click', async function() {
        const tr = btn.closest('tr');
        const tds = tr.querySelectorAll('td');
        const id = getTransactionId(tr, idx);
        const newData = {
          date: tds[0].textContent,
          type: tds[1].textContent,
          account: tds[2].textContent,
          category: tds[3].textContent,
          amount: parseFloat(tds[4].textContent.replace(/[^\d]/g, ''))
        };
        try {
          const user = firebase.auth().currentUser;
          if (!user) return;
          const trxRef = firebase.firestore().collection('users').doc(user.uid).collection('transactions');
          await trxRef.doc(id).update(newData);
          renderDetailTable();
          await syncAllBalances();
          renderIncomeTable();
          renderSavingTable();
          renderExpensesTable();
          renderTransferedTable();
        } catch (err) {
          alert('Error saving transaction');
        }
      });
    });
    detailTable.querySelectorAll('.delete-btn').forEach((btn, idx) => {
      btn.addEventListener('click', async function() {
        if (!confirm('Delete this transaction?')) return;
        const tr = btn.closest('tr');
        const id = getTransactionId(tr, idx);
        try {
          const user = firebase.auth().currentUser;
          if (!user) return;
          const trxRef = firebase.firestore().collection('users').doc(user.uid).collection('transactions');
          await trxRef.doc(id).delete();
          renderDetailTable();
          await syncAllBalances();
          renderIncomeTable();
          renderSavingTable();
          renderExpensesTable();
          renderTransferedTable();
        } catch (err) {
          alert('Error deleting transaction');
        }
      });
    });
    // Helper untuk ambil id transaksi
    function getTransactionId(tr, idx) {
      // Ambil id dari trxs[idx].id (pasti ada setelah fix)
      return trxs[idx] && trxs[idx].id ? trxs[idx].id : '';
    }
    // Helper format date
    function formatDateForInput(dateStr) {
      // dari dd/mm/yyyy ke yyyy-mm-dd
      if (!dateStr) return '';
      const parts = dateStr.split('/');
      if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
      return dateStr;
    }

    // Helper untuk load accounts dan categories ke modal edit
    async function loadEditModalDropdowns(selectedType, selectedAccount, selectedCategory, trx) {
      const editDynamicFields = document.getElementById('edit-dynamic-fields');
      
      if (selectedType === 'saving') {
        // Field untuk saving
        editDynamicFields.innerHTML = `
          <div class="form-group">
            <label for="edit-category">Category</label>
            <select id="edit-category" name="category" required>
              <option value="">Select category</option>
              <option value="bank-bank" ${selectedCategory === 'bank-bank' ? 'selected' : ''}>Bank → Bank</option>
              <option value="bank-invest" ${selectedCategory === 'bank-invest' ? 'selected' : ''}>Bank → Invest</option>
              <option value="invest-bank" ${selectedCategory === 'invest-bank' ? 'selected' : ''}>Invest → Bank</option>
              <option value="invest-invest" ${selectedCategory === 'invest-invest' ? 'selected' : ''}>Invest → Invest</option>
            </select>
          </div>
          <div id="edit-saving-dynamic-fields"></div>
        `;
        
        // Load field dinamis sesuai kategori yang dipilih
        await loadEditSavingDynamicFields(selectedCategory, trx);
        
        // Event listener untuk perubahan kategori
        document.getElementById('edit-category').addEventListener('change', async function() {
          await loadEditSavingDynamicFields(this.value, trx);
        });
      } else {
        // Field untuk income dan expenses
        editDynamicFields.innerHTML = `
          <div class="form-group">
            <label for="edit-account">Account</label>
            <select id="edit-account" name="account" required>
              <option value="">Select account</option>
            </select>
          </div>
          <div class="form-group">
            <label for="edit-category">Category</label>
            <select id="edit-category" name="category" required>
              <option value="">Select category</option>
            </select>
          </div>
        `;
        
        // Load accounts dan categories
        await loadEditAccounts(selectedAccount);
        await loadEditCategories(selectedType, selectedCategory);
      }
    }

    // Helper untuk load field dinamis saving
    async function loadEditSavingDynamicFields(category, trx) {
      const editSavingDynamicFields = document.getElementById('edit-saving-dynamic-fields');
      if (!editSavingDynamicFields) return;
      
      editSavingDynamicFields.innerHTML = '';
      if (!category) return;
      
      if (category === 'bank-bank') {
        const bankList = await loadBankList();
        const accountFrom = trx.account_from || '';
        const accountTo = trx.account_to || '';
        editSavingDynamicFields.innerHTML = `
          <div class="form-group">
            <label>Account</label>
            <select name="account_from" required>
              <option value="">Select account</option>
              ${bankList.replace('<option value="">Select account</option>', '').replace(/<option value="([^"]+)">([^<]+)<\/option>/g, (match, value, text) => 
                `<option value="${value}" ${value === accountFrom ? 'selected' : ''}>${text}</option>`
              )}
            </select>
          </div>
          <div style="text-align:center;font-weight:600;margin-bottom:0.5rem;">Transfer to 💵</div>
          <div class="form-group">
            <label>Account</label>
            <select name="account_to" required>
              <option value="">Select account</option>
              ${bankList.replace('<option value="">Select account</option>', '').replace(/<option value="([^"]+)">([^<]+)<\/option>/g, (match, value, text) => 
                `<option value="${value}" ${value === accountTo ? 'selected' : ''}>${text}</option>`
              )}
            </select>
          </div>
        `;
      } else if (category === 'bank-invest') {
        const bankList = await loadBankList();
        const investList = await loadInvestList();
        const accountFrom = trx.account_from || '';
        const investTo = trx.invest_to || '';
        editSavingDynamicFields.innerHTML = `
          <div class="form-group">
            <label>Account</label>
            <select name="account_from" required>
              <option value="">Select account</option>
              ${bankList.replace('<option value="">Select account</option>', '').replace(/<option value="([^"]+)">([^<]+)<\/option>/g, (match, value, text) => 
                `<option value="${value}" ${value === accountFrom ? 'selected' : ''}>${text}</option>`
              )}
            </select>
          </div>
          <div style="text-align:center;font-weight:600;margin-bottom:0.5rem;">Transfer to 💰</div>
          <div class="form-group">
            <label>Invest</label>
            <select name="invest_to" required>
              <option value="">Select invest</option>
              ${investList.replace('<option value="">Select invest</option>', '').replace(/<option value="([^"]+)">([^<]+)<\/option>/g, (match, value, text) => 
                `<option value="${value}" ${value === investTo ? 'selected' : ''}>${text}</option>`
              )}
            </select>
          </div>
        `;
      } else if (category === 'invest-bank') {
        const investList = await loadInvestList();
        const bankList = await loadBankList();
        const investFrom = trx.invest_from || '';
        const accountTo = trx.account_to || '';
        editSavingDynamicFields.innerHTML = `
          <div class="form-group">
            <label>Invest</label>
            <select name="invest_from" required>
              <option value="">Select invest</option>
              ${investList.replace('<option value="">Select invest</option>', '').replace(/<option value="([^"]+)">([^<]+)<\/option>/g, (match, value, text) => 
                `<option value="${value}" ${value === investFrom ? 'selected' : ''}>${text}</option>`
              )}
            </select>
          </div>
          <div style="text-align:center;font-weight:600;margin-bottom:0.5rem;">Transfer to 💵</div>
          <div class="form-group">
            <label>Account</label>
            <select name="account_to" required>
              <option value="">Select account</option>
              ${bankList.replace('<option value="">Select account</option>', '').replace(/<option value="([^"]+)">([^<]+)<\/option>/g, (match, value, text) => 
                `<option value="${value}" ${value === accountTo ? 'selected' : ''}>${text}</option>`
              )}
            </select>
          </div>
        `;
      } else if (category === 'invest-invest') {
        const investList = await loadInvestList();
        const investFrom = trx.invest_from || '';
        const investTo = trx.invest_to || '';
        editSavingDynamicFields.innerHTML = `
          <div class="form-group">
            <label>Invest</label>
            <select name="invest_from" required>
              <option value="">Select invest</option>
              ${investList.replace('<option value="">Select invest</option>', '').replace(/<option value="([^"]+)">([^<]+)<\/option>/g, (match, value, text) => 
                `<option value="${value}" ${value === investFrom ? 'selected' : ''}>${text}</option>`
              )}
            </select>
          </div>
          <div style="text-align:center;font-weight:600;margin-bottom:0.5rem;">Transfer to 💰</div>
          <div class="form-group">
            <label>Invest</label>
            <select name="invest_to" required>
              <option value="">Select invest</option>
              ${investList.replace('<option value="">Select invest</option>', '').replace(/<option value="([^"]+)">([^<]+)<\/option>/g, (match, value, text) => 
                `<option value="${value}" ${value === investTo ? 'selected' : ''}>${text}</option>`
              )}
            </select>
          </div>
        `;
      }
    }

    // Helper untuk load accounts
    async function loadEditAccounts(selectedAccount) {
      const user = firebase.auth().currentUser;
      const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
      const data = userDoc.data();
      const banks = data && data.banks ? data.banks : [];
      const accountSelect = document.getElementById('edit-account');
      if (!accountSelect) return;
      
      accountSelect.innerHTML = '<option value="">Select account</option>';
      banks.forEach(bank => {
        const option = document.createElement('option');
        option.value = bank;
        option.textContent = bank;
        if (bank === selectedAccount) option.selected = true;
        accountSelect.appendChild(option);
      });
    }

    async function loadEditCategories(type, selectedCategory) {
      const user = firebase.auth().currentUser;
      const categoriesRef = firebase.firestore().collection('users').doc(user.uid).collection('categories');
      const snapshot = await categoriesRef.where('type', '==', type).get();
      const categorySelect = document.getElementById('edit-category');
      if (!categorySelect) return;
      
      categorySelect.innerHTML = '<option value="">Select category</option>';
      snapshot.forEach(doc => {
        const category = doc.data();
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        if (category.name === selectedCategory) option.selected = true;
        categorySelect.appendChild(option);
      });
    }

    // Update field dinamis saat type diubah
    document.getElementById('edit-type').addEventListener('change', async function(e) {
      const type = e.target.value;
      const editDynamicFields = document.getElementById('edit-dynamic-fields');
      
      if (type === 'saving') {
        editDynamicFields.innerHTML = `
          <div class="form-group">
            <label for="edit-category">Category</label>
            <select id="edit-category" name="category" required>
              <option value="">Select category</option>
              <option value="bank-bank">Bank → Bank</option>
              <option value="bank-invest">Bank → Invest</option>
              <option value="invest-bank">Invest → Bank</option>
              <option value="invest-invest">Invest → Invest</option>
            </select>
          </div>
          <div id="edit-saving-dynamic-fields"></div>
        `;
        
        // Event listener untuk perubahan kategori
        document.getElementById('edit-category').addEventListener('change', async function() {
          await loadEditSavingDynamicFields(this.value, {});
        });
      } else {
        editDynamicFields.innerHTML = `
          <div class="form-group">
            <label for="edit-account">Account</label>
            <select id="edit-account" name="account" required>
              <option value="">Select account</option>
            </select>
          </div>
          <div class="form-group">
            <label for="edit-category">Category</label>
            <select id="edit-category" name="category" required>
              <option value="">Select category</option>
            </select>
          </div>
        `;
        
        // Load accounts dan categories
        await loadEditAccounts('');
        await loadEditCategories(type, '');
      }
    });
  }

  // Deklarasi renderExpensesCategoryList
  async function renderExpensesCategoryList() {
    expensesCategoryList.innerHTML = '<li style="text-align:center;color:var(--text-secondary);font-style:italic;">Loading...</li>';
    try {
      const user = firebase.auth().currentUser;
      if (!user) return;
      const categoriesRef = firebase.firestore().collection('users').doc(user.uid).collection('categories');
      const snapshot = await categoriesRef.where('type', '==', 'expenses').get();
      // Ambil semua transaksi expenses (tanpa filter tanggal)
      const transactionsRef = firebase.firestore().collection('users').doc(user.uid).collection('transactions');
      const trxSnap = await transactionsRef
        .where('type', '==', 'expenses')
        .get();
      const trxs = [];
      trxSnap.forEach(doc => trxs.push({ ...doc.data(), id: doc.id }));
      if (snapshot.empty) {
        expensesCategoryList.innerHTML = '<li style="text-align:center;color:var(--text-secondary);font-style:italic;">No categories yet</li>';
        renderExpensesTable();
        renderDetailTable();
        renderSavingTable();
        return;
      }
      expensesCategoryList.innerHTML = '';
      snapshot.forEach(doc => {
        const category = doc.data();
        // Cek apakah kategori ini dipakai di transaksi
        const used = trxs.some(t => t.category === category.name);
        const li = document.createElement('li');
        li.dataset.id = doc.id;
        li.innerHTML = `
          <span class="cat-name">${category.name}</span>
          <span class="category-actions">
            <button class="category-action-btn edit" title="Edit"><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            <button class="category-action-btn save" title="Save" style="display:none;"><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></button>
            <button class="category-action-btn delete" title="Delete" ${used ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3,6 5,6 21,6"/><path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
          </span>
        `;
        expensesCategoryList.appendChild(li);
      });
      renderExpensesTable();
      renderDetailTable();
      renderSavingTable();
      addExpensesCategoryListListeners();
    } catch (error) {
      expensesCategoryList.innerHTML = '<li style="text-align:center;color:red;">Error loading categories<br>'+error+'</li>';
      renderExpensesTable();
      renderDetailTable();
      renderSavingTable();
    }
  }

  // Deklarasi addExpensesCategoryListListeners
  function addExpensesCategoryListListeners() {
    expensesCategoryList.querySelectorAll('.edit').forEach(btn => {
      btn.addEventListener('click', function() {
        const li = btn.closest('li');
        const nameSpan = li.querySelector('.cat-name');
        const saveBtn = li.querySelector('.save');
        btn.style.display = 'none';
        saveBtn.style.display = '';
        const input = document.createElement('input');
        input.type = 'text';
        input.value = nameSpan.textContent;
        input.className = 'edit-input';
        nameSpan.replaceWith(input);
        input.focus();
      });
    });
    expensesCategoryList.querySelectorAll('.save').forEach(btn => {
      btn.addEventListener('click', async function() {
        const li = btn.closest('li');
        const input = li.querySelector('input.edit-input');
        const newName = input.value.trim();
        if (!newName) return;
        const id = li.dataset.id;
        try {
          const user = firebase.auth().currentUser;
          if (!user) return;
          const categoriesRef = firebase.firestore().collection('users').doc(user.uid).collection('categories');
          await categoriesRef.doc(id).update({ name: newName });
          renderExpensesCategoryList();
          loadExpensesCategories();
        } catch (error) {
          alert('Error saving category');
        }
      });
    });
    expensesCategoryList.querySelectorAll('.delete').forEach(btn => {
      btn.addEventListener('click', async function() {
        if (!confirm('Delete this category?')) return;
        const li = btn.closest('li');
        const id = li.dataset.id;
        try {
          const user = firebase.auth().currentUser;
          if (!user) return;
          const categoriesRef = firebase.firestore().collection('users').doc(user.uid).collection('categories');
          await categoriesRef.doc(id).delete();
          renderExpensesCategoryList();
          loadExpensesCategories();
        } catch (error) {
          alert('Error deleting category');
        }
      });
    });
  }

  // Render tabel Expenses
  async function renderExpensesTable() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const expensesTable = document.querySelector('.trx-section.expenses .transactions-table');
    if (!expensesTable) return;

    // Ambil kategori expenses
    const categoriesRef = firebase.firestore().collection('users').doc(user.uid).collection('categories');
    const catSnap = await categoriesRef.where('type', '==', 'expenses').get();
    const categories = [];
    catSnap.forEach(doc => categories.push({ id: doc.id, name: doc.data().name }));

    // Ambil semua transaksi expenses (tanpa filter tanggal)
    const transactionsRef = firebase.firestore().collection('users').doc(user.uid).collection('transactions');
    const trxSnap = await transactionsRef
      .where('type', '==', 'expenses')
      .get();
    const trxs = [];
    trxSnap.forEach(doc => trxs.push({ ...doc.data(), id: doc.id }));

    // Buat header
    let thead = `<tr><th>Category</th>`;
    months.forEach(m => thead += `<th>${m}</th>`);
    thead += `</tr>`;
    expensesTable.querySelector('thead').innerHTML = thead;

    // Buat body
    let tbody = '';
    if (categories.length === 0) {
      tbody = `<tr><td colspan="13" class="no-data">No data yet</td></tr>`;
    } else {
      categories.forEach(cat => {
        tbody += `<tr><td>${cat.name}</td>`;
        for (let i = 0; i < 12; i++) {
          // Cari transaksi pada kategori dan bulan ini
          const found = trxs.find(t => t.category === cat.name && new Date(t.date instanceof Date ? t.date : (t.date && t.date.toDate ? t.date.toDate() : t.date)).getMonth() === i);
          tbody += `<td class="currency-amount">${found ? 'Rp ' + found.amount.toLocaleString('id-ID') : ''}</td>`;
        }
        tbody += `</tr>`;
      });
    }
    expensesTable.querySelector('tbody').innerHTML = tbody;

    // Buat footer total
    let totalPerMonth = Array(12).fill(0);
    trxs.forEach(t => {
      const d = t.date instanceof Date ? t.date : (t.date && t.date.toDate ? t.date.toDate() : t.date);
      const m = new Date(d).getMonth();
      totalPerMonth[m] += t.amount;
    });
    let tfoot = `<tr><td><strong>Total</strong></td>`;
    totalPerMonth.forEach(val => tfoot += `<td class="currency-amount">${val ? 'Rp ' + val.toLocaleString('id-ID') : 'Rp 0'}</td>`);
    tfoot += `</tr>`;
    expensesTable.querySelector('tfoot').innerHTML = tfoot;
  }

  // Render tabel Saving
  async function renderSavingTable() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const savingTable = document.querySelector('.trx-section.saving .transactions-table');
    if (!savingTable) return;

    // Ambil semua transaksi saving (tanpa filter tanggal)
    const transactionsRef = firebase.firestore().collection('users').doc(user.uid).collection('transactions');
    const trxSnap = await transactionsRef
      .where('type', '==', 'saving')
      .get();
    const trxs = [];
    trxSnap.forEach(doc => trxs.push({ ...doc.data(), id: doc.id }));

    // Buat header
    let thead = `<tr><th>Category</th>`;
    months.forEach(m => thead += `<th>${m}</th>`);
    thead += `</tr>`;
    savingTable.querySelector('thead').innerHTML = thead;

    // Buat body
    let tbody = '';
    if (trxs.length === 0) {
      tbody = `<tr><td colspan="13" class="no-data">No data yet</td></tr>`;
    } else {
      // Buat kategori unik dari transaksi saving
      const categories = [...new Set(trxs.map(t => t.category))];
      categories.forEach(cat => {
        tbody += `<tr><td>${cat}</td>`;
        for (let i = 0; i < 12; i++) {
          // Cari transaksi pada kategori dan bulan ini
          const found = trxs.find(t => t.category === cat && new Date(t.date instanceof Date ? t.date : (t.date && t.date.toDate ? t.date.toDate() : t.date)).getMonth() === i);
          tbody += `<td class="currency-amount">${found ? 'Rp ' + found.amount.toLocaleString('id-ID') : ''}</td>`;
        }
        tbody += `</tr>`;
      });
    }
    savingTable.querySelector('tbody').innerHTML = tbody;

    // Buat footer total
    let totalPerMonth = Array(12).fill(0);
    trxs.forEach(t => {
      const d = t.date instanceof Date ? t.date : (t.date && t.date.toDate ? t.date.toDate() : t.date);
      const m = new Date(d).getMonth();
      totalPerMonth[m] += t.amount;
    });
    let tfoot = `<tr><td><strong>Total</strong></td>`;
    totalPerMonth.forEach(val => tfoot += `<td class="currency-amount">${val ? 'Rp ' + val.toLocaleString('id-ID') : 'Rp 0'}</td>`);
    tfoot += `</tr>`;
    savingTable.querySelector('tfoot').innerHTML = tfoot;
  }

  // Open Expenses Category Modal
  if (openExpensesCategoryModalBtn) {
    openExpensesCategoryModalBtn.addEventListener('click', function(e) {
      e.preventDefault();
      expensesCategoryModal.style.display = 'block';
      document.body.style.overflow = 'hidden';
      renderExpensesCategoryList();
    });
  }

  // Close Expenses Category Modal
  function closeExpensesCategoryModal() {
    expensesCategoryModal.style.display = 'none';
    document.body.style.overflow = '';
    addExpensesCategoryForm.reset();
  }
  if (closeExpensesCategoryModalBtn) {
    closeExpensesCategoryModalBtn.addEventListener('click', closeExpensesCategoryModal);
  }
  window.addEventListener('click', function(event) {
    if (event.target === expensesCategoryModal) {
      closeExpensesCategoryModal();
    }
  });

  // Tambah kategori expenses baru
  if (addExpensesCategoryForm) {
    addExpensesCategoryForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const name = newExpensesCategoryInput.value.trim();
      if (!name) return;
      try {
        const user = firebase.auth().currentUser;
        if (!user) return;
        const categoriesRef = firebase.firestore().collection('users').doc(user.uid).collection('categories');
        await categoriesRef.add({
          name,
          type: 'expenses',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        newExpensesCategoryInput.value = '';
        renderExpensesCategoryList();
        loadExpensesCategories(); // update dropdown
      } catch (error) {
        alert('Error adding category');
      }
    });
  }

  // Panggil renderExpensesTable saat halaman dimuat
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      renderExpensesTable();
      renderSavingTable();
      renderTransferedTable();
    }
  });

  // Dinamis field berdasarkan kategori
  if (savingCategory) {
    savingCategory.addEventListener('change', async function() {
      const val = savingCategory.value;
      savingDynamicFields.innerHTML = '';
      if (!val) return;
      if (val === 'bank-bank') {
        // 2x Account
        const bankList = await loadBankList();
        savingDynamicFields.innerHTML = `
          <div class="form-group">
            <label>Account</label>
            <select id="saving-account-from" name="account_from" required>${bankList}</select>
          </div>
          <div style="text-align:center;font-weight:600;margin-bottom:0.5rem;">Transfer to 💵</div>
          <div class="form-group">
            <label>Account</label>
            <select id="saving-account-to" name="account_to" required>${bankList}</select>
          </div>
        `;
      } else if (val === 'bank-invest') {
        const bankList = await loadBankList();
        const investList = await loadInvestList();
        savingDynamicFields.innerHTML = `
          <div class="form-group">
            <label>Account</label>
            <select id="saving-account-from" name="account_from" required>${bankList}</select>
          </div>
          <div style="text-align:center;font-weight:600;margin-bottom:0.5rem;">Transfer to 💰</div>
          <div class="form-group">
            <label>Invest</label>
            <select id="saving-invest-to" name="invest_to" required>${investList}</select>
          </div>
        `;
      } else if (val === 'invest-bank') {
        const investList = await loadInvestList();
        const bankList = await loadBankList();
        savingDynamicFields.innerHTML = `
          <div class="form-group">
            <label>Invest</label>
            <select id="saving-invest-from" name="invest_from" required>${investList}</select>
          </div>
          <div style="text-align:center;font-weight:600;margin-bottom:0.5rem;">Transfer to 💵</div>
          <div class="form-group">
            <label>Account</label>
            <select id="saving-account-to" name="account_to" required>${bankList}</select>
          </div>
        `;
      } else if (val === 'invest-invest') {
        const investList = await loadInvestList();
        savingDynamicFields.innerHTML = `
          <div class="form-group">
            <label>Invest</label>
            <select id="saving-invest-from" name="invest_from" required>${investList}</select>
          </div>
          <div style="text-align:center;font-weight:600;margin-bottom:0.5rem;">Transfer to 💰</div>
          <div class="form-group">
            <label>Invest</label>
            <select id="saving-invest-to" name="invest_to" required>${investList}</select>
          </div>
        `;
      }
    });
  }

  // Transfer Balance Modal - Dinamis field berdasarkan kategori
  const transferCategory = document.getElementById('transfer-category');
  if (transferCategory) {
    transferCategory.addEventListener('change', async function() {
      const val = transferCategory.value;
      const transferDynamicFields = document.getElementById('transfer-dynamic-fields');
      const balanceInfo = document.getElementById('balance-info');
      
      transferDynamicFields.innerHTML = '';
      balanceInfo.style.display = 'none';
      
      if (!val) return;
      
      if (val === 'bank-bank') {
        // 2x Account
        const bankList = await loadBankList();
        transferDynamicFields.innerHTML = `
          <div class="form-group">
            <label>Account</label>
            <select id="transfer-account-from" name="account_from" required>${bankList}</select>
          </div>
          <div style="text-align:center;font-weight:600;margin-bottom:0.5rem;">Transfer to 💵</div>
          <div class="form-group">
            <label>Account</label>
            <select id="transfer-account-to" name="account_to" required>${bankList}</select>
          </div>
        `;
        
        // Event listener untuk disable option yang sama
        document.getElementById('transfer-account-from').addEventListener('change', function() {
          const fromValue = this.value;
          const toSelect = document.getElementById('transfer-account-to');
          Array.from(toSelect.options).forEach(option => {
            option.disabled = option.value === fromValue;
          });
          if (toSelect.value === fromValue) {
            toSelect.value = '';
          }
          updateBalanceInfo('bank', fromValue);
        });
        
        document.getElementById('transfer-account-to').addEventListener('change', function() {
          const toValue = this.value;
          const fromSelect = document.getElementById('transfer-account-from');
          Array.from(fromSelect.options).forEach(option => {
            option.disabled = option.value === toValue;
          });
          if (fromSelect.value === toValue) {
            fromSelect.value = '';
          }
        });
        
      } else if (val === 'bank-invest') {
        const bankList = await loadBankList();
        const investList = await loadInvestList();
        transferDynamicFields.innerHTML = `
          <div class="form-group">
            <label>Account</label>
            <select id="transfer-account-from" name="account_from" required>${bankList}</select>
          </div>
          <div style="text-align:center;font-weight:600;margin-bottom:0.5rem;">Transfer to 💰</div>
          <div class="form-group">
            <label>Invest</label>
            <select id="transfer-invest-to" name="invest_to" required>${investList}</select>
          </div>
        `;
        
        // Event listener untuk update balance info
        document.getElementById('transfer-account-from').addEventListener('change', function() {
          updateBalanceInfo('bank', this.value);
        });
        
      } else if (val === 'invest-bank') {
        const investList = await loadInvestList();
        const bankList = await loadBankList();
        transferDynamicFields.innerHTML = `
          <div class="form-group">
            <label>Invest</label>
            <select id="transfer-invest-from" name="invest_from" required>${investList}</select>
          </div>
          <div style="text-align:center;font-weight:600;margin-bottom:0.5rem;">Transfer to 💵</div>
          <div class="form-group">
            <label>Account</label>
            <select id="transfer-account-to" name="account_to" required>${bankList}</select>
          </div>
        `;
        
        // Event listener untuk update balance info
        document.getElementById('transfer-invest-from').addEventListener('change', function() {
          updateBalanceInfo('invest', this.value);
        });
      } else if (val === 'invest-invest') {
        const investList = await loadInvestList();
        transferDynamicFields.innerHTML = `
          <div class="form-group">
            <label>Invest</label>
            <select id="transfer-invest-from" name="invest_from" required>${investList}</select>
          </div>
          <div style="text-align:center;font-weight:600;margin-bottom:0.5rem;">Transfer to 💰</div>
          <div class="form-group">
            <label>Invest</label>
            <select id="transfer-invest-to" name="invest_to" required>${investList}</select>
          </div>
        `;
        
        // Event listener untuk disable option yang sama
        document.getElementById('transfer-invest-from').addEventListener('change', function() {
          const fromValue = this.value;
          const toSelect = document.getElementById('transfer-invest-to');
          Array.from(toSelect.options).forEach(option => {
            option.disabled = option.value === fromValue;
          });
          if (toSelect.value === fromValue) {
            toSelect.value = '';
          }
          updateBalanceInfo('invest', fromValue);
        });
        
        document.getElementById('transfer-invest-to').addEventListener('change', function() {
          const toValue = this.value;
          const fromSelect = document.getElementById('transfer-invest-from');
          Array.from(fromSelect.options).forEach(option => {
            option.disabled = option.value === toValue;
          });
          if (fromSelect.value === toValue) {
            fromSelect.value = '';
          }
        });
      }
    });
  }

  // Event delegation untuk update balance info
  document.addEventListener('change', function(e) {
    if (e.target.id === 'transfer-account-from') {
      updateBalanceInfo('bank', e.target.value);
    } else if (e.target.id === 'transfer-invest-from') {
      updateBalanceInfo('invest', e.target.value);
    }
  });

  // Function untuk update balance info
  async function updateBalanceInfo(type, sourceName) {
    if (!sourceName) {
      document.getElementById('balance-info').style.display = 'none';
      return;
    }
    
    try {
      const user = firebase.auth().currentUser;
      if (!user) return;
      
      let balance = 0;
      
      if (type === 'bank') {
        // Ambil balance dari localStorage untuk bank (fallback)
        const bankBalances = JSON.parse(localStorage.getItem('bankBalances') || '{}');
        balance = bankBalances[sourceName] || 0;
        
        // Coba ambil dari Firestore jika ada
        try {
          const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
          const data = userDoc.data();
          if (data && data.bankBalances && data.bankBalances[sourceName]) {
            balance = data.bankBalances[sourceName];
          }
        } catch (error) {
          console.log('Using localStorage balance for bank');
        }
      } else if (type === 'invest') {
        // Ambil balance dari localStorage untuk invest (fallback)
        const investBalances = JSON.parse(localStorage.getItem('investBalances') || '{}');
        balance = investBalances[sourceName] || 0;
        
        // Coba ambil dari Firestore jika ada
        try {
          const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
          const data = userDoc.data();
          if (data && data.investBalances && data.investBalances[sourceName]) {
            balance = data.investBalances[sourceName];
          }
        } catch (error) {
          console.log('Using localStorage balance for invest');
        }
      }
      
      // Update tampilan balance
      document.getElementById('balance-amount').textContent = `Rp ${balance.toLocaleString('id-ID')}`;
      document.getElementById('balance-info').style.display = 'block';
      
    } catch (error) {
      console.error('Error updating balance info:', error);
      document.getElementById('balance-info').style.display = 'none';
    }
  }

  // Helper untuk load bank dan invest
  async function loadBankList() {
    const user = firebase.auth().currentUser;
    if (!user) return '';
    const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
    const data = userDoc.data();
    const banks = data && data.banks ? data.banks : [];
    let html = '<option value="">Select account</option>';
    banks.forEach(bank => {
      html += `<option value="${bank}">${bank}</option>`;
    });
    return html;
  }
  async function loadInvestList() {
    const user = firebase.auth().currentUser;
    if (!user) return '';
    const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
    const data = userDoc.data();
    const invests = data && data.investments ? data.investments : [];
    let html = '<option value="">Select invest</option>';
    invests.forEach(inv => {
      html += `<option value="${inv}">${inv}</option>`;
    });
    return html;
  }

  // Fungsi sinkronisasi saldo bank & invest
  async function syncAllBalances() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const transactionsRef = firebase.firestore().collection('users').doc(user.uid).collection('transactions');
    const trxSnap = await transactionsRef.get();
    const trxs = [];
    trxSnap.forEach(doc => trxs.push(doc.data()));

    // Hitung saldo bank & invest
    let bankBalances = {};
    let investBalances = {};

    trxs.forEach(t => {
      // Income/Expenses
      if (t.type === 'income' && t.account) {
        bankBalances[t.account] = (bankBalances[t.account] || 0) + t.amount;
      }
      if (t.type === 'expenses' && t.account) {
        bankBalances[t.account] = (bankBalances[t.account] || 0) - t.amount;
      }
      // Saving/Transfer
      if ((t.type === 'saving' || t.type === 'transfer') && t.category && t.amount) {
        if (t.category === 'bank-bank') {
          bankBalances[t.account_from] = (bankBalances[t.account_from] || 0) - t.amount;
          bankBalances[t.account_to] = (bankBalances[t.account_to] || 0) + t.amount;
        } else if (t.category === 'bank-invest') {
          bankBalances[t.account_from] = (bankBalances[t.account_from] || 0) - t.amount;
          investBalances[t.invest_to] = (investBalances[t.invest_to] || 0) + t.amount;
        } else if (t.category === 'invest-bank') {
          investBalances[t.invest_from] = (investBalances[t.invest_from] || 0) - t.amount;
          bankBalances[t.account_to] = (bankBalances[t.account_to] || 0) + t.amount;
        } else if (t.category === 'invest-invest') {
          investBalances[t.invest_from] = (investBalances[t.invest_from] || 0) - t.amount;
          investBalances[t.invest_to] = (investBalances[t.invest_to] || 0) + t.amount;
        }
      }
    });

    // Simpan ke localStorage
    localStorage.setItem('bankBalances', JSON.stringify(bankBalances));
    localStorage.setItem('investBalances', JSON.stringify(investBalances));

    // Simpan ke Firestore
    await firebase.firestore().collection('users').doc(user.uid).update({
      bankBalances,
      investBalances
    });
  }

  // Render tabel Transfered
  async function renderTransferedTable() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    const transferedTable = document.querySelector('.trx-section.transfered .transactions-table');
    if (!transferedTable) return;

    // Ambil semua transaksi saving hasil transfer balance
    const transactionsRef = firebase.firestore().collection('users').doc(user.uid).collection('transactions');
    const trxSnap = await transactionsRef.where('type', '==', 'transfer').get();
    const trxs = [];
    trxSnap.forEach(doc => trxs.push({ ...doc.data(), id: doc.id }));

    // Filter hanya yang hasil dari tombol Transfer Balance (memiliki field account_from/invest_from)
    const filtered = trxs.filter(t => t.account_from || t.invest_from);

    // Isi tabel
    let tbody = '';
    let total = 0;
    if (filtered.length === 0) {
      tbody = `<tr><td colspan="5" class="no-data">No data yet</td></tr>`;
    } else {
      filtered.forEach(t => {
        const d = t.date instanceof Date ? t.date : (t.date && t.date.toDate ? t.date.toDate() : t.date);
        const dateStr = d ? new Date(d).toLocaleDateString('id-ID') : '';
        let from = t.account_from || t.invest_from || '-';
        let to = t.account_to || t.invest_to || '-';
        tbody += `<tr>
          <td>${dateStr}</td>
          <td>${t.category || '-'}</td>
          <td>${from}</td>
          <td>${to}</td>
          <td class="currency-amount">${t.amount ? 'Rp ' + t.amount.toLocaleString('id-ID') : ''}</td>
        </tr>`;
        total += t.amount || 0;
      });
    }
    transferedTable.querySelector('tbody').innerHTML = tbody;
    transferedTable.querySelector('tfoot td:last-child').textContent = `Rp ${total}`;
  }

  // Panggil renderTransferedTable setelah transaksi/ubah/hapus
  // ... existing code ...
});