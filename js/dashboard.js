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
  const savedTheme = localStorage.getItem('theme');
  const isDark = savedTheme === 'dark';
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
  function renderBankBalance() {
    if (!bankBalanceList) return;
    if (!selectedBanks.length) {
      bankBalanceList.innerHTML = 'No account found.';
      return;
    }
    // Icon dompet (Wallet Outline Simple)
    const walletSVG = `<svg class=\"bank-wallet-icon\" xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" viewBox=\"0 0 24 24\"><rect x=\"2\" y=\"7\" width=\"20\" height=\"14\" rx=\"3\"/><path d=\"M16 7V5a3 3 0 0 0-6 0v2\"/><circle cx=\"16.5\" cy=\"14.5\" r=\"1.5\"/></svg>`;
    bankBalanceList.innerHTML = selectedBanks.map(b => `<div class=\"bank-balance-item\"><span class='bank-icon' style='margin-right:8px;'>${walletSVG}</span><span>${b}</span> <span class='bank-amount' style='float:right;font-weight:600;'>Rp.0</span></div>`).join('');
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
      // Jika ada perubahan, update Firestore agar selectedBanks selalu valid
      if (changed && user) {
        db.collection('users').doc(user.uid).set({ selectedBanks }, { merge: true });
      }
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
      // Jika ada perubahan, update Firestore agar selectedInvestments selalu valid
      if (changed && user) {
        db.collection('users').doc(user.uid).set({ selectedInvestments }, { merge: true });
      }
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
  let cfSelectedTypes = ['income'];
  let cashflowChart = null;

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

  // Inisialisasi Chart.js
  function initCashflowChart() {
    const ctx = document.getElementById('cashflow-chart');
    if (!ctx) return;

    // Label bulan (Jan - Dec)
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // Data kosong
    const emptyData = Array(labels.length).fill(null);

    const datasets = [];
    // Tambahkan dataset berdasarkan filter yang dipilih
    if (cfSelectedTypes.includes('income')) {
      datasets.push({
        label: 'Income',
        data: emptyData,
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
        data: emptyData,
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
        data: emptyData,
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
        labels: labels,
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
              color: getComputedStyle(document.body).getPropertyValue('--text-main'),
              font: {
                family: 'Inter',
                size: 12
              },
              usePointStyle: true,
              padding: 15
            }
          },
          tooltip: {
            backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg-card'),
            titleColor: getComputedStyle(document.body).getPropertyValue('--text-main'),
            bodyColor: getComputedStyle(document.body).getPropertyValue('--text-secondary'),
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
              color: getComputedStyle(document.body).getPropertyValue('--text-secondary'),
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
              color: getComputedStyle(document.body).getPropertyValue('--text-secondary'),
              font: {
                family: 'Inter',
                size: 11
              },
              callback: function(value) {
                return 'Rp' + (value / 1000000).toFixed(0) + 'M';
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
    setTimeout(() => {
      initCashflowChart();
    }, 500);
  });

  // Highlight tombol periode cashflow (Daily, Weekly, Monthly, Yearly)
  const cfPeriodBtns = document.querySelectorAll('.cf-period-btn');
  cfPeriodBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      cfPeriodBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // TODO: update chart sesuai periode jika sudah ada data
    });
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
  function renderInvestBalance() {
    const investBalanceList = document.querySelector('.invest-balance-box .card-content');
    if (!investBalanceList) return;
    if (!selectedInvestments.length) {
      investBalanceList.innerHTML = 'No investment found.';
      return;
    }
    // Icon investasi (Dollar Sign in Circle)
    const investSVG = `<svg class=\"invest-wallet-icon\" xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 8v8\"/><path d=\"M8 12h8\"/><path d=\"M12 16c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2\"/></svg>`;
    investBalanceList.innerHTML = selectedInvestments.map(inv => `<div class=\"bank-balance-item\"><span class='bank-icon' style='margin-right:8px;'>${investSVG}</span><span>${inv}</span> <span class='bank-amount' style='float:right;font-weight:600;'>Rp.0</span></div>`).join('');
  }
}); 