const STORAGE_KEY = 'pi-quiz-leaderboard';
const TABLE = 'leaderboard';
const MAX_NAME_LENGTH = 10;

let supabaseClient = null;

export function configureSupabase(client, table = TABLE) {
  supabaseClient = client;
  window.__PI_QUIZ_SUPABASE__ = { client, table };
}

function getLocalLeaderboard() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const entries = JSON.parse(raw);
    return Array.isArray(entries) ? entries : [];
  } catch {
    return [];
  }
}

function saveLocalLeaderboard(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function normalizeEntry(row) {
  return {
    name: row.name,
    score: row.score,
    date: row.date ?? row.played_at,
  };
}

function sortEntries(entries) {
  return [...entries].sort(
    (a, b) => b.score - a.score || a.name.localeCompare(b.name)
  );
}

export function getLeaderboard() {
  return getLocalLeaderboard();
}

async function fetchFromSupabase() {
  if (!supabaseClient) return null;

  const { data, error } = await supabaseClient
    .from(TABLE)
    .select('name, score, played_at')
    .order('score', { ascending: false })
    .order('name', { ascending: true })
    .limit(50);

  if (error) {
    console.warn('Leaderboard fetch failed:', error.message);
    return null;
  }

  return sortEntries(
    data.map((row) => normalizeEntry({ ...row, date: row.played_at }))
  );
}

export async function loadLeaderboard() {
  const remote = await fetchFromSupabase();
  if (remote) {
    saveLocalLeaderboard(remote);
    return remote;
  }
  return getLocalLeaderboard();
}

export async function addScore(name, score) {
  const trimmed = name.trim().slice(0, MAX_NAME_LENGTH);
  if (!trimmed) return loadLeaderboard();

  const entry = {
    name: trimmed,
    score,
    date: new Date().toISOString(),
  };

  const entries = getLocalLeaderboard();
  const existing = entries.findIndex(
    (e) => e.name.toLowerCase() === trimmed.toLowerCase()
  );

  if (existing >= 0) {
    if (score > entries[existing].score) {
      entries[existing] = entry;
    }
  } else {
    entries.push(entry);
  }

  saveLocalLeaderboard(sortEntries(entries).slice(0, 50));

  await syncToSupabase(entry);

  return loadLeaderboard();
}

export async function renderLeaderboard(containerEl) {
  containerEl.innerHTML = '<p class="leaderboard-empty">Loading…</p>';

  const entries = await loadLeaderboard();
  containerEl.innerHTML = '';

  if (entries.length === 0) {
    containerEl.innerHTML =
      '<p class="leaderboard-empty">No scores yet. Be the first!</p>';
    return;
  }

  const list = document.createElement('ol');
  list.className = 'leaderboard-list';

  entries.slice(0, 10).forEach((entry, i) => {
    const li = document.createElement('li');
    li.className = 'leaderboard-item';
    li.innerHTML = `
      <span class="leaderboard-rank">${i + 1}</span>
      <span class="leaderboard-name">${escapeHtml(entry.name)}</span>
      <span class="leaderboard-score">${entry.score}</span>
    `;
    list.appendChild(li);
  });

  containerEl.appendChild(list);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function syncToSupabase(entry) {
  if (!supabaseClient) return;

  const { data: existing, error: readError } = await supabaseClient
    .from(TABLE)
    .select('score')
    .eq('name', entry.name)
    .maybeSingle();

  if (readError) {
    console.warn('Leaderboard read failed:', readError.message);
    return;
  }

  if (existing && existing.score >= entry.score) return;

  const { error } = await supabaseClient.from(TABLE).upsert(
    { name: entry.name, score: entry.score, played_at: entry.date },
    { onConflict: 'name' }
  );

  if (error) {
    console.warn('Leaderboard save failed:', error.message);
  }
}
