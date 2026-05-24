import { createGame } from './game.js';
import { initSupabase } from './supabase-config.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initSupabase();
  } catch (err) {
    console.warn('Supabase init failed, using local leaderboard only:', err);
  }

  createGame(document.getElementById('app'));
});
