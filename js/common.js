// Dark/Light mode toggle
function setTheme(isDark) {
  if (isDark) {
    document.body.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.classList.remove('dark');
    localStorage.setItem('theme', 'light');
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