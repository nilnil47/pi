/**
 * Supabase integration — enable when credentials are provided.
 *
 * Usage:
 *   import { initSupabase } from './supabase-config.js';
 *   await initSupabase('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');
 */
import { configureSupabase } from './leaderboard.js';

let supabaseModule = null;

async function loadSupabase() {
  if (supabaseModule) return supabaseModule;
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  supabaseModule = { createClient };
  return supabaseModule;
}

export async function initSupabase(url, anonKey, table = 'leaderboard') {
  const { createClient } = await loadSupabase();
  const client = createClient(url, anonKey);
  configureSupabase(client, table);
  return client;
}
