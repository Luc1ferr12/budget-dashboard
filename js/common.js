// Dark/Light mode toggle
function setTheme(isDark) {
  if (isDark) {
    document.body.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    document.getElementById('theme-label').textContent = 'Dark Mode';
  } else {
    document.body.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    document.getElementById('theme-label').textContent = 'Light Mode';
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const themeSwitch = document.getElementById('theme-switch');
  if (!themeSwitch) return;
  // Set initial theme
  const savedTheme = localStorage.getItem('theme');
  const isDark = savedTheme === 'dark';
  themeSwitch.checked = isDark;
  setTheme(isDark);
  themeSwitch.addEventListener('change', function() {
    setTheme(this.checked);
  });
}); 