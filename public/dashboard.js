// Pastikan Supabase client siap
loadSupabaseClient(() => {
  // Tampilkan nama user login
  window.supabaseClient.auth.getUser().then(({ data: { user } }) => {
    if (user) {
      document.getElementById('user-info').textContent = user.user_metadata.full_name || user.email;
    }
  });

  // Dummy data summary
  document.getElementById('income-value').textContent = 'IDR 12,000,000';
  document.getElementById('savings-value').textContent = 'IDR 4,500,000';
  document.getElementById('expenses-value').textContent = 'IDR 2,800,000';
  document.getElementById('budget-value').textContent = 'IDR 10,000,000';

  // Dummy account balances
  document.getElementById('account-balances-list').innerHTML = `
    <ul>
      <li>Main Account: <b>IDR 7,500,000</b></li>
      <li>Savings Account: <b>IDR 4,500,000</b></li>
      <li>Cash: <b>IDR 1,200,000</b></li>
    </ul>
  `;

  // Sidebar dark mode toggle
  document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'sidebar-darkmode-toggle') {
      const isDark = !document.body.classList.contains('dark');
      document.body.classList.toggle('dark', isDark);
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
  });

  // Set theme dari localStorage
  const theme = localStorage.getItem('theme');
  document.body.classList.toggle('dark', theme === 'dark');
}); 