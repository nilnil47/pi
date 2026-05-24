const STORAGE_KEY = 'pi-quiz-leaderboard';

/**
 * Local leaderboard — will be extended with Supabase when credentials are provided.
 */
export function getLeaderboard() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const entries = JSON.parse(raw);
    return Array.isArray(entries) ? entries : [];
  } catch {
    return [];
  }
}

function saveLeaderboard(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function addScore(name, score) {
  const trimmed = name.trim();
  if (!trimmed) return getLeaderboard();

  const entries = getLeaderboard();
  const existing = entries.findIndex((e) => e.name.toLowerCase() === trimmed.toLowerCase());

  const entry = {
    name: trimmed,
    score,
    date: new Date().toISOString(),
  };

  if (existing >= 0) {
    if (score > entries[existing].score) {
      entries[existing] = entry;
    }
  } else {
    entries.push(entry);
  }

  entries.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  saveLeaderboard(entries.slice(0, 50));

  // Supabase sync hook — enabled when credentials are configured
  syncToSupabase(entry).catch(() => {});

  return getLeaderboard();
}

export function renderLeaderboard(containerEl) {
  const entries = getLeaderboard();
  containerEl.innerHTML = '';

  if (entries.length === 0) {
    containerEl.innerHTML = '<p class="leaderboard-empty">No scores yet. Be the first!</p>';
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

/** Placeholder for Supabase integration — wired up when keys are provided */
async function syncToSupabase(entry) {
  if (!window.__PI_QUIZ_SUPABASE__) return;
  const { client, table } = window.__PI_QUIZ_SUPABASE__;
  await client.from(table).upsert(
    { name: entry.name, score: entry.score, played_at: entry.date },
    { onConflict: 'name' }
  );
}

export function configureSupabase(client, table = 'leaderboard') {
  window.__PI_QUIZ_SUPABASE__ = { client, table };
}
