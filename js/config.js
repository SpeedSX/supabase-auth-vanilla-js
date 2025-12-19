// Supabase Configuration
// Replace these with your actual Supabase project URL and anon key
const SUPABASE_URL = 'https://gokcvbqvmbvnuexvrglv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdva2N2YnF2bWJ2bnVleHZyZ2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjUzNzcsImV4cCI6MjA3NDc0MTM3N30.hT3ktQRqjHgGknz4GAb9zunp_SXX1EghGZqtNjm2TgE';

// Check if configuration is set
if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
    console.warn('⚠️ Please configure your Supabase URL and API key in js/config.js');
    showMessage('Please configure your Supabase credentials in js/config.js', 'error');
}

// Initialize Supabase client
// Note: window.supabase is the library from CDN (non-configurable), we create a client instance
// We store it in window.supabaseClient to avoid the redeclaration error
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);