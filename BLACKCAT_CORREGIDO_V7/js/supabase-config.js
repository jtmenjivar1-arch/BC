const SUPABASE_URL = 'https://gzwcdmcxpbkqnszpfwoa.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1X-z22Y2rIcxCdEG475Gbg_GodawfdH';

// Carga segura: si el CDN de Supabase no responde localmente, la web sigue abriendo
// con los datos guardados/default de js/config.js.
var supabaseClient = null;
if (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.warn('Supabase no cargó todavía. Se usará respaldo local para probar en VS Code/Live Server.');
}
