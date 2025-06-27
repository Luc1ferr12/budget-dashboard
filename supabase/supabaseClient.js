// Ganti dengan URL dan anon key project Supabase Anda
const SUPABASE_URL = 'https://dkvjhbhubrftspzltxns.supabase.co';
const SUPABASE_ANON_KEY = 'ISI_DENGAN_ANON_KEY_ASLI'; // Ganti dengan anon key asli dari dashboard Supabase Anda

// Fungsi untuk memastikan Supabase JS sudah siap sebelum inisialisasi client
function loadSupabaseClient(callback) {
  if (window.supabase && window.supabase.createClient) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    if (callback) callback();
  } else {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.7/dist/umd/supabase.min.js';
    script.onload = () => {
      window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      if (callback) callback();
    };
    document.head.appendChild(script);
  }
}

// Contoh penggunaan:
// loadSupabaseClient(() => {
//   // supabase sudah siap digunakan
// }); 