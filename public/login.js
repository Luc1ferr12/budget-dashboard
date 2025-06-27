// Pastikan Supabase client sudah siap sebelum digunakan
loadSupabaseClient(() => {
  // Cek jika user sudah login
  window.supabaseClient.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      window.location.href = 'dashboard.html';
    }
  });

  // Login dengan Google
  const googleBtn = document.getElementById('google-login');
  googleBtn.addEventListener('click', async () => {
    const { error } = await window.supabaseClient.auth.signInWithOAuth({ provider: 'google' });
    if (error) alert('Login failed!');
  });

  // Dark mode toggle
  const darkToggle = document.getElementById('toggle-darkmode');
  const setDarkMode = (isDark) => {
    document.body.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    darkToggle.checked = isDark;
  };

  darkToggle.addEventListener('change', (e) => {
    setDarkMode(e.target.checked);
  });

  // Load theme dari localStorage
  const theme = localStorage.getItem('theme');
  setDarkMode(theme === 'dark');
}); 