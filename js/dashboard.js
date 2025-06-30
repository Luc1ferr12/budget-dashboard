// Import firebase.js
// <script src="../firebase.js"></script> sudah diindex.html

// Gunakan auth dari firebase.js, jangan deklarasi ulang

document.addEventListener('DOMContentLoaded', function() {
  auth.onAuthStateChanged(function(user) {
    if (!user) {
      window.location.href = 'login.html';
    } else {
      // Tampilkan nama depan user di greeting
      const name = user.displayName || user.email || '';
      const greetEl = document.getElementById('user-greet');
      if (greetEl) {
        greetEl.textContent = name.split(' ')[0];
      }
      document.body.classList.remove('hide');
    }
  });

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      auth.signOut();
    });
  }

  // Tambahkan event listener untuk tombol logout di bottom-navbar (ponsel)
  const navLogout = document.querySelector('.nav-logout');
  if (navLogout) {
    navLogout.addEventListener('click', function(e) {
      e.preventDefault();
      auth.signOut();
    });
  }

  // Dark/Light mode toggle dengan icon bulan/matahari
  function setTheme(isDark) {
    const themeIcon = document.getElementById('theme-icon');
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

  const themeBtn = document.getElementById('theme-toggle-btn');
  let savedTheme = localStorage.getItem('theme');
  let isDark = savedTheme === 'dark';
  if (!savedTheme) {
    isDark = true;
    localStorage.setItem('theme', 'dark');
  }
  setTheme(isDark);
  if (themeBtn) {
    themeBtn.addEventListener('click', function() {
      setTheme(!document.body.classList.contains('dark'));
    });
  }

  // Modal Select Bank
  const addBtn = document.querySelector('.account-balance-box .add-btn');
  const modal = document.getElementById('select-bank-modal');
  const cancelBtn = document.querySelector('.modal-cancel');
  const saveBtn = document.querySelector('.modal-save');
  const modalBankList = document.getElementById('modal-bank-list');

  let currentUser = null;
  let userBanks = [];
  let selectedBanks = [];

  const bankBalanceList = document.querySelector('.account-balance-box .card-content');

  // Render bank list di modal
  function renderModalBanks() {
    modalBankList.innerHTML = '';
    if (!userBanks || userBanks.length === 0) {
      modalBankList.innerHTML = '<div class="no-banks">No banks found. <a href="add-bank.html" id="add-bank-link">Add bank</a></div>';
      return;
    }
    // Checkbox list
    userBanks.forEach((bank, idx) => {
      const id = 'modal-bank-' + idx;
      const checked = selectedBanks.includes(bank) ? 'checked' : '';
      const item = document.createElement('div');
      item.className = 'modal-bank-item';
      item.innerHTML = `<input type="checkbox" id="${id}" value="${bank}" ${checked} ${selectedBanks.length >= 3 && !checked ? 'disabled' : ''}>
        <label for="${id}">${bank}</label>`;
      modalBankList.appendChild(item);
    });
    // Info jika lebih dari 3
    if (selectedBanks.length >= 3) {
      const info = document.createElement('div');
      info.style.color = 'var(--text-secondary)';
      info.style.fontSize = '0.97rem';
      info.style.marginTop = '0.5rem';
      info.textContent = 'You can select up to 3 banks only.';
      modalBankList.appendChild(info);
    }
  }

  // Render bank balance di card
  async function renderBankBalance() {
    if (!bankBalanceList) return;
    if (!selectedBanks.length) {
      bankBalanceList.innerHTML = 'No account found.';
      return;
    }

    // Ambil data transaksi untuk menghitung balance
    const bankBalances = await calculateBankBalances();
    
    // Icon dompet (Wallet Outline Simple)
    const walletSVG = `<svg class=\"bank-wallet-icon\" xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" viewBox=\"0 0 24 24\"><rect x=\"2\" y=\"7\" width=\"20\" height=\"14\" rx=\"3\"/><path d=\"M16 7V5a3 3 0 0 0-6 0v2\"/><circle cx=\"16.5\" cy=\"14.5\" r=\"1.5\"/></svg>`;
    
    bankBalanceList.innerHTML = selectedBanks.map(bank => {
      const balance = bankBalances[bank] || 0;
      const formattedBalance = balance.toLocaleString('id-ID');
      return `<div class=\"bank-balance-item\">
        <span class='bank-icon' style='margin-right:8px;'>${walletSVG}</span>
        <span>${bank}</span> 
        <span class='bank-amount' style='float:right;font-weight:600;'>Rp ${formattedBalance}</span>
      </div>`;
    }).join('');
  }

  // Hitung balance bank dari transaksi
  async function calculateBankBalances() {
    if (!currentUser) return {};
    
    try {
      const transactionsRef = db.collection('users').doc(currentUser.uid).collection('transactions');
      const snapshot = await transactionsRef.get();
      
      const bankBalances = {};
      
      // Inisialisasi balance untuk setiap bank yang dipilih
      selectedBanks.forEach(bank => {
        bankBalances[bank] = 0;
      });
      
      // Ambil semua transaksi dan filter berdasarkan tanggal
      const allTransactions = [];
      snapshot.forEach(doc => {
        allTransactions.push(doc.data());
      });
      
      const filteredTransactions = filterTransactionsByDate(allTransactions);
      
      filteredTransactions.forEach(transaction => {
        const amount = transaction.amount || 0;
        
        if (transaction.type === 'income') {
          // Income menambah balance
          if (transaction.account && bankBalances.hasOwnProperty(transaction.account)) {
            bankBalances[transaction.account] += amount;
          }
        } else if (transaction.type === 'expenses') {
          // Expenses mengurangi balance
          if (transaction.account && bankBalances.hasOwnProperty(transaction.account)) {
            bankBalances[transaction.account] -= amount;
          }
        } else if (transaction.type === 'saving' || transaction.type === 'transfer') {
          // Saving/Transfer antar account
          if (transaction.category === 'bank-bank') {
            // Bank → Bank: kurangi dari account_from, tambah ke account_to
            if (transaction.account_from && bankBalances.hasOwnProperty(transaction.account_from)) {
              bankBalances[transaction.account_from] -= amount;
            }
            if (transaction.account_to && bankBalances.hasOwnProperty(transaction.account_to)) {
              bankBalances[transaction.account_to] += amount;
            }
          } else if (transaction.category === 'bank-invest') {
            // Bank → Invest: kurangi dari account_from
            if (transaction.account_from && bankBalances.hasOwnProperty(transaction.account_from)) {
              bankBalances[transaction.account_from] -= amount;
            }
          } else if (transaction.category === 'invest-bank') {
            // Invest → Bank: tambah ke account_to
            if (transaction.account_to && bankBalances.hasOwnProperty(transaction.account_to)) {
              bankBalances[transaction.account_to] += amount;
            }
          }
          // invest-invest tidak mempengaruhi bank balance
        }
      });
      
      return bankBalances;
    } catch (error) {
      console.error('Error calculating bank balances:', error);
      return {};
    }
  }

  // Hitung total balance dari semua bank
  async function calculateTotalBalance() {
    const bankBalances = await calculateBankBalances();
    return Object.values(bankBalances).reduce((total, balance) => total + balance, 0);
  }

  // Update summary cards berdasarkan data transaksi
  async function updateSummaryCards() {
    if (!currentUser) return;
    
    try {
      const transactionsRef = db.collection('users').doc(currentUser.uid).collection('transactions');
      const snapshot = await transactionsRef.get();
      
      let totalIncome = 0;
      let totalSaving = 0;
      let totalExpenses = 0;
      
      // Ambil semua transaksi dan filter berdasarkan tanggal
      const allTransactions = [];
      snapshot.forEach(doc => {
        allTransactions.push(doc.data());
      });
      
      const filteredTransactions = filterTransactionsByDate(allTransactions);
      
      filteredTransactions.forEach(transaction => {
        const amount = transaction.amount || 0;
        
        if (transaction.type === 'income') {
          totalIncome += amount;
        } else if (transaction.type === 'saving') {
          totalSaving += amount;
        } else if (transaction.type === 'expenses') {
          totalExpenses += amount;
        }
      });
      
      const totalBalance = await calculateTotalBalance();
      
      // Update summary cards
      const incomeCard = document.querySelector('.summary-card.income .card-value');
      const savingCard = document.querySelector('.summary-card.savings .card-value');
      const balanceCard = document.querySelector('.summary-card.balance .card-value');
      const expensesCard = document.querySelector('.summary-card.expenses .card-value');
      
      if (incomeCard) incomeCard.textContent = `Rp${totalIncome.toLocaleString('id-ID')}`;
      if (savingCard) savingCard.textContent = `Rp${totalSaving.toLocaleString('id-ID')}`;
      if (balanceCard) balanceCard.textContent = `Rp${totalBalance.toLocaleString('id-ID')}`;
      if (expensesCard) expensesCard.textContent = `Rp${totalExpenses.toLocaleString('id-ID')}`;
      
    } catch (error) {
      console.error('Error updating summary cards:', error);
    }
  }

  // Ambil data bank user dari Firestore
  function listenUserBanks(user) {
    db.collection('users').doc(user.uid).onSnapshot(doc => {
      const data = doc.data() || {};
      userBanks = data.banks || [];
      // Hapus selectedBanks yang tidak ada di userBanks
      let changed = false;
      selectedBanks = (data.selectedBanks || userBanks.slice(0, 5)).filter(b => userBanks.includes(b));
      if (data.selectedBanks && selectedBanks.length !== data.selectedBanks.length) {
        changed = true;
      }
      renderModalBanks();
      renderBankBalance();
      updateSummaryCards();
      initCashflowChart();
      // Jika ada perubahan, update Firestore agar selectedBanks selalu valid
      if (changed && user) {
        db.collection('users').doc(user.uid).set({ selectedBanks }, { merge: true });
      }
    });

    // Real-time listener untuk transaksi
    db.collection('users').doc(user.uid).collection('transactions').onSnapshot(snapshot => {
      // Update bank balance setiap kali ada perubahan transaksi
      renderBankBalance();
      // Update summary cards
      updateSummaryCards();
      // Update cashflow chart
      initCashflowChart();
    });
  }

  // Ambil data investment user dari Firestore
  function listenUserInvestments(user) {
    db.collection('users').doc(user.uid).onSnapshot(doc => {
      const data = doc.data() || {};
      userInvestments = data.investments || [];
      // Hapus selectedInvestments yang tidak ada di userInvestments
      let changed = false;
      selectedInvestments = (data.selectedInvestments || userInvestments.slice(0, 3)).filter(inv => userInvestments.includes(inv));
      if (data.selectedInvestments && selectedInvestments.length !== data.selectedInvestments.length) {
        changed = true;
      }
      renderModalInvestments();
      renderInvestBalance();
      initCashflowChart();
      // Jika ada perubahan, update Firestore agar selectedInvestments selalu valid
      if (changed && user) {
        db.collection('users').doc(user.uid).set({ selectedInvestments }, { merge: true });
      }
    });

    // Real-time listener untuk transaksi (invest balance)
    db.collection('users').doc(user.uid).collection('transactions').onSnapshot(snapshot => {
      // Update invest balance setiap kali ada perubahan transaksi
      renderInvestBalance();
      // Update cashflow chart
      initCashflowChart();
    });
  }

  // Tunggu user login
  firebase.auth().onAuthStateChanged(function(user) {
    if (!user) return;
    currentUser = user;
    listenUserBanks(user);
    listenUserInvestments(user);
  });

  if (addBtn && modal) {
    addBtn.addEventListener('click', function(e) {
      e.preventDefault();
      modal.style.display = 'flex';
      renderModalBanks();
    });
  }
  if (cancelBtn && modal) {
    cancelBtn.addEventListener('click', function() {
      modal.style.display = 'none';
    });
  }
  if (saveBtn && modal) {
    saveBtn.addEventListener('click', function() {
      // Simpan selectedBanks ke Firestore
      if (currentUser) {
        db.collection('users').doc(currentUser.uid).set({ selectedBanks }, { merge: true });
      }
      modal.style.display = 'none';
      renderBankBalance();
      updateSummaryCards();
      initCashflowChart();
    });
  }
  // Optional: close modal on overlay click
  modal && modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.style.display = 'none';
  });

  // Handle checkbox select max 3
  modalBankList && modalBankList.addEventListener('change', function(e) {
    if (e.target.type === 'checkbox') {
      const val = e.target.value;
      if (e.target.checked) {
        if (selectedBanks.length < 3) selectedBanks.push(val);
      } else {
        selectedBanks = selectedBanks.filter(b => b !== val);
      }
      renderModalBanks();
    }
  });

  // === Cashflow Multi-Select Filter ===
  const cfTypeBtn = document.getElementById('cf-type-btn');
  const cfTypeList = document.getElementById('cf-type-list');
  let cfSelectedTypes = ['income', 'saving', 'expenses'];
  let cashflowChart = null;

  // Filter khusus untuk cashflow chart
  const cfMonthSelect = document.getElementById('cf-month');
  const cfYearSelect = document.getElementById('cf-year');
  let cfSelectedYear = new Date().getFullYear();
  let cfSelectedMonth = null; // null = semua bulan

  // Set tahun default untuk cashflow filter
  if (cfYearSelect) {
    cfYearSelect.value = cfSelectedYear;
  }

  // Event listener untuk filter tahun cashflow
  if (cfYearSelect) {
    cfYearSelect.addEventListener('change', function() {
      cfSelectedYear = parseInt(this.value);
      updateCashflowChart();
    });
  }

  // Event listener untuk filter bulan cashflow
  if (cfMonthSelect) {
    cfMonthSelect.addEventListener('change', function() {
      const selectedMonthValue = this.value;
      
      if (selectedMonthValue === '') {
        cfSelectedMonth = null; // Semua bulan
      } else {
        cfSelectedMonth = parseInt(selectedMonthValue) - 1; // Convert ke 0-based index
      }
      
      updateCashflowChart();
    });
  }

  // Function untuk filter transaksi khusus cashflow
  function filterTransactionsForCashflow(transactions) {
    return transactions.filter(transaction => {
      const date = transaction.date;
      if (!date) return false;
      
      let transactionDate;
      if (date instanceof Date) {
        transactionDate = date;
      } else if (date && date.toDate) {
        transactionDate = date.toDate();
      } else if (typeof date === 'string') {
        transactionDate = new Date(date);
      } else {
        return false;
      }
      
      const transactionYear = transactionDate.getFullYear();
      const transactionMonth = transactionDate.getMonth();
      
      // Filter berdasarkan tahun cashflow
      if (transactionYear !== cfSelectedYear) {
        return false;
      }
      
      // Filter berdasarkan bulan cashflow (jika dipilih)
      if (cfSelectedMonth !== null && transactionMonth !== cfSelectedMonth) {
        return false;
      }
      
      return true;
    });
  }

  // Periode cashflow (daily, weekly, monthly, yearly)
  let cfSelectedPeriod = 'daily'; // default

  // Event listener untuk tombol periode cashflow
  const cfPeriodBtns = document.querySelectorAll('.cf-period-btn');
  cfPeriodBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      // Remove active class dari semua tombol
      cfPeriodBtns.forEach(b => b.classList.remove('active'));
      // Add active class ke tombol yang diklik
      btn.classList.add('active');
      
      // Set periode yang dipilih
      cfSelectedPeriod = btn.getAttribute('data-period');
      
      // Update chart cashflow
      updateCashflowChart();
    });
  });

  // Function untuk mendapatkan data cashflow berdasarkan periode
  async function getCashflowDataByPeriod() {
    if (!currentUser) {
      return {
        labels: [],
        income: [],
        saving: [],
        expenses: []
      };
    }
    
    try {
      const transactionsRef = db.collection('users').doc(currentUser.uid).collection('transactions');
      const snapshot = await transactionsRef.get();
      
      // Ambil semua transaksi dan filter berdasarkan tanggal cashflow
      const allTransactions = [];
      snapshot.forEach(doc => {
        allTransactions.push(doc.data());
      });
      
      const filteredTransactions = filterTransactionsForCashflow(allTransactions);
      
      let labels = [];
      let income = [];
      let saving = [];
      let expenses = [];
      
      if (cfSelectedPeriod === 'daily') {
        // Data harian untuk bulan yang dipilih (atau bulan sekarang jika tidak ada filter bulan)
        const targetMonth = cfSelectedMonth !== null ? cfSelectedMonth : new Date().getMonth();
        const daysInMonth = new Date(cfSelectedYear, targetMonth + 1, 0).getDate();
        
        labels = Array.from({length: daysInMonth}, (_, i) => i + 1);
        income = Array(daysInMonth).fill(0);
        saving = Array(daysInMonth).fill(0);
        expenses = Array(daysInMonth).fill(0);
        
        filteredTransactions.forEach(transaction => {
          const date = transaction.date;
          if (!date) return;
          
          let transactionDate;
          if (date instanceof Date) {
            transactionDate = date;
          } else if (date && date.toDate) {
            transactionDate = date.toDate();
          } else if (typeof date === 'string') {
            transactionDate = new Date(date);
          } else {
            return;
          }
          
          const day = transactionDate.getDate() - 1; // 0-based index
          const amount = transaction.amount || 0;
          
          if (transaction.type === 'income') {
            income[day] += amount;
          } else if (transaction.type === 'saving') {
            saving[day] += amount;
          } else if (transaction.type === 'expenses') {
            expenses[day] += amount;
          }
        });
        
      } else if (cfSelectedPeriod === 'weekly') {
        // Data mingguan untuk tahun yang dipilih
        const weeksInYear = 52;
        labels = Array.from({length: weeksInYear}, (_, i) => `Week ${i + 1}`);
        income = Array(weeksInYear).fill(0);
        saving = Array(weeksInYear).fill(0);
        expenses = Array(weeksInYear).fill(0);
        
        filteredTransactions.forEach(transaction => {
          const date = transaction.date;
          if (!date) return;
          
          let transactionDate;
          if (date instanceof Date) {
            transactionDate = date;
          } else if (date && date.toDate) {
            transactionDate = date.toDate();
          } else if (typeof date === 'string') {
            transactionDate = new Date(date);
          } else {
            return;
          }
          
          // Hitung minggu ke berapa dalam tahun
          const startOfYear = new Date(transactionDate.getFullYear(), 0, 1);
          const days = Math.floor((transactionDate - startOfYear) / (1000 * 60 * 60 * 24));
          const week = Math.floor(days / 7);
          
          if (week >= 0 && week < weeksInYear) {
            const amount = transaction.amount || 0;
            
            if (transaction.type === 'income') {
              income[week] += amount;
            } else if (transaction.type === 'saving') {
              saving[week] += amount;
            } else if (transaction.type === 'expenses') {
              expenses[week] += amount;
            }
          }
        });
        
      } else if (cfSelectedPeriod === 'monthly') {
        // Data bulanan (default - seperti sebelumnya)
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        income = Array(12).fill(0);
        saving = Array(12).fill(0);
        expenses = Array(12).fill(0);
        
        filteredTransactions.forEach(transaction => {
          const date = transaction.date;
          if (!date) return;
          
          let transactionDate;
          if (date instanceof Date) {
            transactionDate = date;
          } else if (date && date.toDate) {
            transactionDate = date.toDate();
          } else if (typeof date === 'string') {
            transactionDate = new Date(date);
          } else {
            return;
          }
          
          const month = transactionDate.getMonth();
          const amount = transaction.amount || 0;
          
          if (transaction.type === 'income') {
            income[month] += amount;
          } else if (transaction.type === 'saving') {
            saving[month] += amount;
          } else if (transaction.type === 'expenses') {
            expenses[month] += amount;
          }
        });
        
      } else if (cfSelectedPeriod === 'yearly') {
        // Data tahunan (3 tahun terakhir)
        const currentYear = new Date().getFullYear();
        labels = [(currentYear - 2).toString(), (currentYear - 1).toString(), currentYear.toString()];
        income = Array(3).fill(0);
        saving = Array(3).fill(0);
        expenses = Array(3).fill(0);
        
        // Ambil semua transaksi (tanpa filter tahun untuk yearly view)
        const allTransactionsForYearly = [];
        snapshot.forEach(doc => {
          allTransactionsForYearly.push(doc.data());
        });
        
        allTransactionsForYearly.forEach(transaction => {
          const date = transaction.date;
          if (!date) return;
          
          let transactionDate;
          if (date instanceof Date) {
            transactionDate = date;
          } else if (date && date.toDate) {
            transactionDate = date.toDate();
          } else if (typeof date === 'string') {
            transactionDate = new Date(date);
          } else {
            return;
          }
          
          const year = transactionDate.getFullYear();
          const yearIndex = labels.indexOf(year.toString());
          
          if (yearIndex >= 0) {
            const amount = transaction.amount || 0;
            
            if (transaction.type === 'income') {
              income[yearIndex] += amount;
            } else if (transaction.type === 'saving') {
              saving[yearIndex] += amount;
            } else if (transaction.type === 'expenses') {
              expenses[yearIndex] += amount;
            }
          }
        });
      }
      
      return { labels, income, saving, expenses };
    } catch (error) {
      console.error('Error getting cashflow data by period:', error);
      return {
        labels: [],
        income: [],
        saving: [],
        expenses: []
      };
    }
  }

  // Function untuk update semua data dashboard berdasarkan filter
  async function updateDashboardData() {
    await updateSummaryCards();
    await renderBankBalance();
    await renderInvestBalance();
    await initCashflowChart();
  }

  // Filter tahun dan bulan untuk dashboard utama
  const yearSelect = document.getElementById('year-select');
  const monthSelect = document.getElementById('month-select');
  let selectedYear = new Date().getFullYear();
  let selectedMonth = null; // null = semua bulan

  // Set tahun default ke tahun sekarang
  if (yearSelect) {
    yearSelect.value = selectedYear;
  }

  // Event listener untuk filter tahun dashboard utama
  if (yearSelect) {
    yearSelect.addEventListener('change', function() {
      selectedYear = parseInt(this.value);
      updateDashboardData();
    });
  }

  // Event listener untuk filter bulan dashboard utama
  if (monthSelect) {
    monthSelect.addEventListener('change', function() {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      const selectedMonthName = this.value;
      
      if (selectedMonthName === '-- All month --') {
        selectedMonth = null;
      } else {
        selectedMonth = monthNames.indexOf(selectedMonthName);
      }
      
      updateDashboardData();
    });
  }

  // Function untuk filter transaksi berdasarkan tahun dan bulan dashboard utama
  function filterTransactionsByDate(transactions) {
    return transactions.filter(transaction => {
      const date = transaction.date;
      if (!date) return false;
      
      let transactionDate;
      if (date instanceof Date) {
        transactionDate = date;
      } else if (date && date.toDate) {
        transactionDate = date.toDate();
      } else if (typeof date === 'string') {
        transactionDate = new Date(date);
      } else {
        return false;
      }
      
      const transactionYear = transactionDate.getFullYear();
      const transactionMonth = transactionDate.getMonth();
      
      // Filter berdasarkan tahun dashboard utama
      if (transactionYear !== selectedYear) {
        return false;
      }
      
      // Filter berdasarkan bulan dashboard utama (jika dipilih)
      if (selectedMonth !== null && transactionMonth !== selectedMonth) {
        return false;
      }
      
      return true;
    });
  }

  // Plugin Chart.js untuk pesan kosong
  const emptyChartMessage = {
    id: 'emptyChartMessage',
    afterDraw(chart) {
      const datasets = chart.data.datasets;
      // Cek jika semua data null/undefined/0
      const isEmpty = datasets.length === 0 || datasets.every(ds => !ds.data.some(v => v !== null && v !== undefined && v !== 0));
      if (isEmpty) {
        const ctx = chart.ctx;
        const width = chart.width;
        const height = chart.height;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '600 1.2rem Inter, Arial';
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-secondary') || '#888';
        ctx.fillText('Belum ada data cash flow', width / 2, height / 2);
        ctx.restore();
      }
    }
  };

  // Ambil data transaksi untuk chart cashflow
  async function getCashflowData() {
    if (!currentUser) {
      return {
        income: Array(12).fill(0),
        saving: Array(12).fill(0),
        expenses: Array(12).fill(0)
      };
    }
    
    try {
      const transactionsRef = db.collection('users').doc(currentUser.uid).collection('transactions');
      const snapshot = await transactionsRef.get();
      
      // Inisialisasi array untuk setiap bulan
      const income = Array(12).fill(0);
      const saving = Array(12).fill(0);
      const expenses = Array(12).fill(0);
      
      // Ambil semua transaksi dan filter berdasarkan tanggal cashflow
      const allTransactions = [];
      snapshot.forEach(doc => {
        allTransactions.push(doc.data());
      });
      
      const filteredTransactions = filterTransactionsForCashflow(allTransactions);
      
      filteredTransactions.forEach(transaction => {
        const amount = transaction.amount || 0;
        const date = transaction.date;
        
        if (date) {
          // Konversi date ke bulan (0-11)
          let month;
          if (date instanceof Date) {
            month = date.getMonth();
          } else if (date && date.toDate) {
            month = date.toDate().getMonth();
          } else if (typeof date === 'string') {
            month = new Date(date).getMonth();
          } else {
            return; // Skip jika tidak bisa parse date
          }
          
          // Tambahkan ke array sesuai tipe transaksi
          if (transaction.type === 'income') {
            income[month] += amount;
          } else if (transaction.type === 'saving') {
            saving[month] += amount;
          } else if (transaction.type === 'expenses') {
            expenses[month] += amount;
          }
        }
      });
      
      return { income, saving, expenses };
    } catch (error) {
      console.error('Error getting cashflow data:', error);
      return {
        income: Array(12).fill(0),
        saving: Array(12).fill(0),
        expenses: Array(12).fill(0)
      };
    }
  }

  // Fungsi untuk mendapatkan warna chart yang benar sesuai mode
  function getChartTextColor() {
    return document.body.classList.contains('dark') ? '#fff' : '#111';
  }
  function getChartTooltipBg() {
    return document.body.classList.contains('dark') ? '#232a36' : '#fff';
  }

  // Inisialisasi Chart.js
  async function initCashflowChart() {
    const ctx = document.getElementById('cashflow-chart');
    if (!ctx) return;

    // Ambil data transaksi untuk mengisi chart berdasarkan periode
    const chartData = await getCashflowDataByPeriod();

    const datasets = [];
    // Tambahkan dataset berdasarkan filter yang dipilih
    if (cfSelectedTypes.includes('income')) {
      datasets.push({
        label: 'Income',
        data: chartData.income,
        borderColor: '#38b2ac',
        backgroundColor: 'rgba(56, 178, 172, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4
      });
    }
    if (cfSelectedTypes.includes('saving')) {
      datasets.push({
        label: 'Saving',
        data: chartData.saving,
        borderColor: '#68d391',
        backgroundColor: 'rgba(104, 211, 145, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4
      });
    }
    if (cfSelectedTypes.includes('expenses')) {
      datasets.push({
        label: 'Expenses',
        data: chartData.expenses,
        borderColor: '#f56565',
        backgroundColor: 'rgba(245, 101, 101, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4
      });
    }

    const config = {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: getChartTextColor(),
              font: {
                family: 'Inter',
                size: 12
              },
              usePointStyle: true,
              padding: 15
            }
          },
          tooltip: {
            backgroundColor: getChartTooltipBg(),
            titleColor: getChartTextColor(),
            bodyColor: getChartTextColor(),
            borderColor: getComputedStyle(document.body).getPropertyValue('--border-color'),
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': Rp' + (context.parsed.y ? context.parsed.y.toLocaleString('id-ID') : '0');
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: getComputedStyle(document.body).getPropertyValue('--border-color'),
              drawBorder: false
            },
            ticks: {
              color: getChartTextColor(),
              font: {
                family: 'Inter',
                size: 11
              }
            }
          },
          y: {
            grid: {
              color: getComputedStyle(document.body).getPropertyValue('--border-color'),
              drawBorder: false
            },
            ticks: {
              color: getChartTextColor(),
              font: {
                family: 'Inter',
                size: 11
              },
              callback: function(value) {
                // Format nilai dengan separator ribuan
                if (value >= 1000000) {
                  // Untuk nilai 1 juta ke atas, tampilkan dengan format "Rp X.XXX.XXX"
                  return 'Rp ' + (value / 1000000).toFixed(0) + '.000.000';
                } else if (value >= 1000) {
                  // Untuk nilai ribuan, tampilkan dengan format "Rp X.XXX"
                  return 'Rp ' + (value / 1000).toFixed(0) + '.000';
                } else {
                  // Untuk nilai di bawah 1000, tampilkan asli
                  return 'Rp ' + value.toLocaleString('id-ID');
                }
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        elements: {
          point: {
            radius: 4,
            hoverRadius: 6
          }
        }
      },
      plugins: [emptyChartMessage]
    };

    // Destroy chart lama jika ada
    if (cashflowChart) {
      cashflowChart.destroy();
    }

    // Buat chart baru
    cashflowChart = new Chart(ctx, config);

    // Tambahkan event listener untuk update chart saat mode berubah
    if (!window._chartThemeListenerAdded) {
      window._chartThemeListenerAdded = true;
      const observer = new MutationObserver(() => {
        if (cashflowChart) {
          initCashflowChart();
        }
      });
      observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }
  }

  // Update chart berdasarkan filter
  function updateCashflowChart() {
    if (cashflowChart) {
      initCashflowChart();
    }
  }

  if (cfTypeBtn && cfTypeList) {
    cfTypeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      cfTypeList.style.display = cfTypeList.style.display === 'none' ? 'block' : 'none';
      cfTypeBtn.classList.toggle('active');
    });
    // Tutup dropdown jika klik di luar
    document.addEventListener('click', function(e) {
      if (!cfTypeList.contains(e.target) && e.target !== cfTypeBtn) {
        cfTypeList.style.display = 'none';
        cfTypeBtn.classList.remove('active');
      }
    });
    // Handle ceklist
    cfTypeList.addEventListener('change', function(e) {
      if (e.target.type === 'checkbox') {
        const val = e.target.value;
        if (e.target.checked) {
          if (!cfSelectedTypes.includes(val)) cfSelectedTypes.push(val);
        } else {
          cfSelectedTypes = cfSelectedTypes.filter(t => t !== val);
        }
        // Update chart berdasarkan filter yang dipilih
        updateCashflowChart();
      }
    });
  }

  // Inisialisasi chart saat halaman dimuat
  document.addEventListener('DOMContentLoaded', function() {
    // Chart akan diinisialisasi setelah user login dan data transaksi dimuat
  });

  // Modal Select Investment
  const investAddBtn = document.querySelector('.invest-balance-box .add-btn');
  const investModal = document.getElementById('select-investment-modal');
  const investCancelBtn = document.querySelector('.modal-investment-cancel');
  const investSaveBtn = document.querySelector('.modal-investment-save');
  const modalInvestmentList = document.getElementById('modal-investment-list');

  let userInvestments = [];
  let selectedInvestments = [];

  // Render investment list di modal
  function renderModalInvestments() {
    modalInvestmentList.innerHTML = '';
    if (!userInvestments || userInvestments.length === 0) {
      modalInvestmentList.innerHTML = '<div class="no-investments">You still have not invesment list.</div>';
      return;
    }
    userInvestments.forEach((inv, idx) => {
      const id = 'modal-investment-' + idx;
      const checked = selectedInvestments.includes(inv) ? 'checked' : '';
      const item = document.createElement('div');
      item.className = 'modal-bank-item';
      item.innerHTML = `<input type="checkbox" id="${id}" value="${inv}" ${checked} ${selectedInvestments.length >= 3 && !checked ? 'disabled' : ''}>
        <label for="${id}">${inv}</label>`;
      modalInvestmentList.appendChild(item);
    });
    if (selectedInvestments.length >= 3) {
      const info = document.createElement('div');
      info.style.color = 'var(--text-secondary)';
      info.style.fontSize = '0.97rem';
      info.style.marginTop = '0.5rem';
      info.textContent = 'You can select up to 3 banks only.';
      modalInvestmentList.appendChild(info);
    }
  }

  if (investAddBtn && investModal) {
    investAddBtn.addEventListener('click', function(e) {
      e.preventDefault();
      investModal.style.display = 'flex';
      renderModalInvestments();
    });
  }
  if (investCancelBtn && investModal) {
    investCancelBtn.addEventListener('click', function() {
      investModal.style.display = 'none';
    });
  }
  if (investSaveBtn && investModal) {
    investSaveBtn.addEventListener('click', function() {
      // Simpan selectedInvestments ke Firestore
      if (currentUser) {
        db.collection('users').doc(currentUser.uid).set({ selectedInvestments }, { merge: true });
      }
      investModal.style.display = 'none';
      renderInvestBalance();
      initCashflowChart();
    });
  }
  // Optional: close modal on overlay click
  investModal && investModal.addEventListener('click', function(e) {
    if (e.target === investModal) investModal.style.display = 'none';
  });
  // Handle checkbox select max 3
  modalInvestmentList && modalInvestmentList.addEventListener('change', function(e) {
    if (e.target.type === 'checkbox') {
      const val = e.target.value;
      if (e.target.checked) {
        if (selectedInvestments.length < 3) selectedInvestments.push(val);
      } else {
        selectedInvestments = selectedInvestments.filter(b => b !== val);
      }
      renderModalInvestments();
    }
  });

  // Render invest balance di card
  async function renderInvestBalance() {
    const investBalanceList = document.querySelector('.invest-balance-box .card-content');
    if (!investBalanceList) return;
    if (!selectedInvestments.length) {
      investBalanceList.innerHTML = 'No investment found.';
      return;
    }

    // Ambil data transaksi untuk menghitung balance investasi
    const investBalances = await calculateInvestBalances();
    
    // Icon investasi (Dollar Sign in Circle)
    const investSVG = `<svg class=\"invest-wallet-icon\" xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 8v8\"/><path d=\"M8 12h8\"/><path d=\"M12 16c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2\"/></svg>`;
    
    investBalanceList.innerHTML = selectedInvestments.map(inv => {
      const balance = investBalances[inv] || 0;
      const formattedBalance = balance.toLocaleString('id-ID');
      return `<div class=\"bank-balance-item\">
        <span class='bank-icon' style='margin-right:8px;'>${investSVG}</span>
        <span>${inv}</span> 
        <span class='bank-amount' style='float:right;font-weight:600;'>Rp ${formattedBalance}</span>
      </div>`;
    }).join('');
  }

  // Hitung balance investasi dari transaksi
  async function calculateInvestBalances() {
    if (!currentUser) return {};
    
    try {
      const transactionsRef = db.collection('users').doc(currentUser.uid).collection('transactions');
      const snapshot = await transactionsRef.get();
      
      const investBalances = {};
      
      // Inisialisasi balance untuk setiap investasi yang dipilih
      selectedInvestments.forEach(inv => {
        investBalances[inv] = 0;
      });
      
      // Ambil semua transaksi dan filter berdasarkan tanggal
      const allTransactions = [];
      snapshot.forEach(doc => {
        allTransactions.push(doc.data());
      });
      
      const filteredTransactions = filterTransactionsByDate(allTransactions);
      
      filteredTransactions.forEach(transaction => {
        const amount = transaction.amount || 0;
        
        if (transaction.type === 'saving' || transaction.type === 'transfer') {
          // Saving/Transfer yang mempengaruhi investasi
          if (transaction.category === 'bank-invest') {
            // Bank → Invest: tambah ke invest_to
            if (transaction.invest_to && investBalances.hasOwnProperty(transaction.invest_to)) {
              investBalances[transaction.invest_to] += amount;
            }
          } else if (transaction.category === 'invest-bank') {
            // Invest → Bank: kurangi dari invest_from
            if (transaction.invest_from && investBalances.hasOwnProperty(transaction.invest_from)) {
              investBalances[transaction.invest_from] -= amount;
            }
          } else if (transaction.category === 'invest-invest') {
            // Invest → Invest: kurangi dari invest_from, tambah ke invest_to
            if (transaction.invest_from && investBalances.hasOwnProperty(transaction.invest_from)) {
              investBalances[transaction.invest_from] -= amount;
            }
            if (transaction.invest_to && investBalances.hasOwnProperty(transaction.invest_to)) {
              investBalances[transaction.invest_to] += amount;
            }
          }
          // bank-bank tidak mempengaruhi invest balance
        }
      });
      
      return investBalances;
    } catch (error) {
      console.error('Error calculating invest balances:', error);
      return {};
    }
  }
}); 