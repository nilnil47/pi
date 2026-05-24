import { configureSupabase } from './leaderboard.js';

export const SUPABASE_URL = 'https://hoqbttccxzugjjymuldy.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_nP1DWJ4rBR2u7t1P4jILfw_HyvFeq8H';

let supabaseModule = null;
let client = null;

async function loadSupabase() {
  if (supabaseModule) return supabaseModule;
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  supabaseModule = { createClient };
  return supabaseModule;
}

export async function initSupabase(table = 'leaderboard') {
  if (client) return client;

  const { createClient } = await loadSupabase();
  client = createClient(SUPABASE_URL, SUPABASE_KEY);
  configureSupabase(client, table);
  return client;
}

export function getSupabaseClient() {
  return client;
}
