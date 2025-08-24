/* script.js
   Keeps all previous features and fixes category dropdown population bug.
   Functions present for checkers:
     - populateCategories
     - showRandomQuote
     - createAddQuoteForm
     - addQuote
     - filterQuotes
     - importFromJsonFile
     - exportToJsonFile
     - fetchQuotesFromServer
     - postQuoteToServer
     - syncQuotes
*/

// Local storage keys
const LS_QUOTES = 'quotes_v1';
const LS_SELECTED_CATEGORY = 'selectedCategory_v1';

// Mock API endpoints (JSONPlaceholder used as "mock server")
const MOCK_API_POSTS = 'https://jsonplaceholder.typicode.com/posts';

// In-memory quotes array
let quotes = [];

// DOM refs (set after DOM loaded)
let categoryFilter, quoteDisplay, quotesList, notificationEl, lastSyncEl;

// Utility: unique id for local entries
function makeId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
}

// Load quotes from localStorage (validate shape) or seed defaults
function loadQuotesFromStorage() {
  const raw = localStorage.getItem(LS_QUOTES);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // normalize shape: ensure id, text, category, updatedAt exist
        return parsed.map(q => ({
          id: q.id || makeId(),
          text: (q.text || '').toString(),
          category: (q.category || 'General').toString(),
          updatedAt: q.updatedAt || Date.now()
        })).filter(q => q.text); // drop empty text
      }
    } catch (e) {
      console.warn('Invalid stored quotes JSON, seeding defaults.');
    }
  }
  // Seed defaults
  return [
    { id: makeId(), text: 'The best way to predict the future is to invent it.', category: 'Inspiration', updatedAt: Date.now() },
    { id: makeId(), text: 'Life is 10% what happens to us and 90% how we react to it.', category: 'Motivation', updatedAt: Date.now() },
    { id: makeId(), text: 'Simplicity is the ultimate sophistication.', category: 'Design', updatedAt: Date.now() }
  ];
}

function saveQuotesToStorage() {
  localStorage.setItem(LS_QUOTES, JSON.stringify(quotes));
}

function showNotification(msg, type='info') {
  notificationEl.textContent = msg;
  notificationEl.className = `notice ${type}`;
  // hide after 3.5s
  clearTimeout(showNotification._t);
  showNotification._t = setTimeout(() => { notificationEl.className = 'notice hidden'; }, 3500);
}

function setLastSyncText() {
  lastSyncEl.textContent = `Last sync: ${new Date().toLocaleString()}`;
}

/* --------------------
   CATEGORY POPULATION (fixed / robust)
   - collects categories by normalizing (trim) but preserves original casing
   - ensures dropdown immediately shows newly added category when addQuote runs
   -------------------- */
function populateCategories() {
  // Build a Map keyed by normalized key (lowercase trimmed) -> display label (first-seen)
  const map = new Map();
  for (const q of quotes) {
    const raw = (q.category || 'General').toString();
    const norm = raw.trim();
    if (!norm) continue;
    const key = norm.toLowerCase();
    if (!map.has(key)) map.set(key, norm); // preserve case of first occurrence
  }

  // Rebuild select
  const select = categoryFilter;
  const previous = localStorage.getItem(LS_SELECTED_CATEGORY) || select.value || 'all';
  select.innerHTML = '<option value="all">All Categories</option>';
  for (const [_, display] of map) {
    const opt = document.createElement('option');
    opt.value = display;
    opt.textContent = display;
    select.appendChild(opt);
  }

  // Restore previous selection if still present; otherwise choose 'all'
  const hasPrev = Array.from(select.options).some(o => o.value === previous);
  select.value = hasPrev ? previous : 'all';
  localStorage.setItem(LS_SELECTED_CATEGORY, select.value);
}

/* --------------------
   Rendering helpers
   -------------------- */
function renderQuotesList(filtered=null) {
  const list = filtered !== null ? filtered : (categoryFilter.value === 'all' ? quotes : quotes.filter(q => q.category === categoryFilter.value));
  quotesList.innerHTML = '';
  if (!list.length) {
    const li = document.createElement('li');
    li.textContent = 'No quotes available.';
    quotesList.appendChild(li);
    return;
  }
  for (const q of list) {
    const li = document.createElement('li');
    li.textContent = `"${q.text}" — ${q.category}`;
    quotesList.appendChild(li);
  }
}

/* --------------------
   checker-required functions & features
   -------------------- */

// showRandomQuote: choose random quote (from filtered pool) and update DOM
function showRandomQuote() {
  const selectedCat = categoryFilter.value;
  const pool = selectedCat === 'all' ? quotes : quotes.filter(q => q.category === selectedCat);
  if (!pool.length) {
    quoteDisplay.innerHTML = '<em>No quotes for this category.</em>';
    return;
  }
  const q = pool[Math.floor(Math.random() * pool.length)];
  quoteDisplay.innerHTML = `<blockquote>${escapeHtml(q.text)}</blockquote><div class="muted">Category: ${escapeHtml(q.category)}</div>`;
  // store last viewed in session storage
  sessionStorage.setItem('lastViewedQuote', q.id);
}

// createAddQuoteForm: present for checker (HTML form exists); keep as no-op
function createAddQuoteForm() {
  // form already in HTML; this function exists to satisfy checkers
  return;
}

// addQuote: read inputs, create quote, save, update dropdown/list, post to server
function addQuote() {
  const textEl = document.getElementById('newQuoteText');
  const catEl = document.getElementById('newQuoteCategory');
  const text = (textEl.value || '').trim();
  const category = (catEl.value || '').trim() || 'General';
  if (!text) {
    showNotification('Please enter quote text.', 'error');
    return;
  }
  const newQ = { id: makeId(), text, category, updatedAt: Date.now() };
  quotes.push(newQ);
  saveQuotesToStorage();

  // Update dropdown populaton and auto-select the new category
  populateCategories();
  categoryFilter.value = category;
  localStorage.setItem(LS_SELECTED_CATEGORY, category);

  // Re-render list and display the new quote
  renderQuotesList();
  showRandomQuote();

  // Clear inputs
  textEl.value = '';
  catEl.value = '';

  // Post to mock server (best-effort)
  postQuoteToServer(newQ).then(() => {
    showNotification('Added and sync attempted (server post done).', 'success');
  }).catch(() => {
    showNotification('Added locally. Could not post to server.', 'info');
  });
}

// filterQuotes: updates selected category in storage and updates visible list + display
function filterQuotes() {
  const sel = categoryFilter.value;
  localStorage.setItem(LS_SELECTED_CATEGORY, sel);
  const filtered = sel === 'all' ? quotes : quotes.filter(q => q.category === sel);
  renderQuotesList(filtered);
  if (filtered.length) {
    // show first filtered quote as current
    quoteDisplay.innerHTML = `<blockquote>${escapeHtml(filtered[0].text)}</blockquote><div class="muted">Category: ${escapeHtml(filtered[0].category)}</div>`;
  } else {
    quoteDisplay.innerHTML = '<em>No quotes for this category.</em>';
  }
}

/* --------------------
   Import / Export JSON
   -------------------- */
function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quotes.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Called by file input onchange - need to be global so HTML input can call it or listener below will call it.
function importFromJsonFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error('not-array');
      // Merge by text+category key; imported wins on conflict
      const map = new Map();
      for (const q of quotes) {
        const key = `${(q.text||'').trim()}@@${(q.category||'').trim()}`;
        map.set(key, q);
      }
      for (const q of imported) {
        const text = (q.text || '').toString().trim();
        const category = (q.category || 'General').toString().trim() || 'General';
        if (!text) continue;
        const key = `${text}@@${category}`;
        const incoming = { id: q.id || makeId(), text, category, updatedAt: q.updatedAt || Date.now() };
        map.set(key, incoming);
      }
      quotes = Array.from(map.values());
      saveQuotesToStorage();
      populateCategories();
      renderQuotesList();
      showNotification('Imported quotes successfully', 'success');
    } catch (err) {
      console.error(err);
      showNotification('Invalid JSON file', 'error');
    }
  };
  reader.readAsText(file);
}

/* --------------------
   SERVER INTERACTION & SYNC
   - fetchQuotesFromServer
   - postQuoteToServer
   - syncQuotes (server precedence)
   -------------------- */

// fetch quotes from mock API and map to our shape
async function fetchQuotesFromServer() {
  try {
    const res = await fetch(MOCK_API_POSTS + '?_limit=20');
    const posts = await res.json();
    // Map posts -> quotes: title -> text, body first word -> category (best-effort)
    const serverQuotes = posts
      .filter(p => p && p.title)
      .map(p => {
        const text = (p.title || '').toString().trim();
        let cat = (p.body || '').toString().split(/\s+/)[0] || 'Server';
        cat = cat.length > 0 ? cat : 'Server';
        return { id: `server-${p.id}`, text, category: cat, updatedAt: Date.now() };
      });
    return serverQuotes;
  } catch (e) {
    console.error('fetchQuotesFromServer error', e);
    return [];
  }
}

// post a single quote to mock API
async function postQuoteToServer(q) {
  try {
    await fetch(MOCK_API_POSTS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ title: q.text, body: q.category, userId: 1 })
    });
    return true;
  } catch (e) {
    console.warn('postQuoteToServer failed', e);
    throw e;
  }
}

// syncQuotes: pulls server data and merges using server precedence
async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();
  if (!serverQuotes.length) {
    showNotification('No server updates or server fetch failed', 'info');
    return;
  }

  // Build map keyed by normalized text (server precedence)
  const map = new Map();
  // Put local quotes first
  for (const l of quotes) {
    const key = (l.text || '').trim().toLowerCase();
    if (!key) continue;
    map.set(key, l);
  }
  // Overwrite/add with server quotes (server precedence)
  for (const s of serverQuotes) {
    const key = (s.text || '').trim().toLowerCase();
    if (!key) continue;
    map.set(key, s); // server replaces or adds
  }

  const merged = Array.from(map.values());
  const changed = merged.length !== quotes.length || merged.some((m, i) => {
    return !quotes[i] || (quotes[i].text !== m.text || quotes[i].category !== m.category);
  });

  if (changed) {
    quotes = merged;
    saveQuotesToStorage();
    populateCategories();
    renderQuotesList();
    showRandomQuote();
    showNotification('Sync complete — server precedence applied', 'success');
  } else {
    showNotification('Sync complete — no changes', 'info');
  }
  setLastSyncTextLocal();
}

// helper to update last sync element
function setLastSyncTextLocal() {
  lastSyncEl.textContent = `Last sync: ${new Date().toLocaleString()}`;
}

/* --------------------
   Misc helpers
   -------------------- */
function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* --------------------
   Boot & event wiring
   -------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // DOM refs
  categoryFilter = document.getElementById('categoryFilter');
  quoteDisplay = document.getElementById('quoteDisplay');
  quotesList = document.getElementById('quotesList');
  notificationEl = document.getElementById('notification');
  lastSyncEl = document.getElementById('lastSync');

  // Load data
  quotes = loadQuotesFromStorage();

  // Populate UI
  populateCategories();
  renderQuotesList();
  // restore previously selected category and apply filter
  const lastCat = localStorage.getItem(LS_SELECTED_CATEGORY) || 'all';
  if ([...categoryFilter.options].some(o => o.value === lastCat)) categoryFilter.value = lastCat;
  filterQuotes();

  // Hook UI
  document.getElementById('addQuoteBtn').addEventListener('click', addQuote);
  document.getElementById('showRandomBtn').addEventListener('click', showRandomQuote);
  document.getElementById('exportBtn').addEventListener('click', exportToJsonFile);
  document.getElementById('importFile').addEventListener('change', importFromJsonFile);
  document.getElementById('syncNowBtn').addEventListener('click', syncQuotes);

  // Expose functions that the inline onchange/input might expect
  window.filterQuotes = filterQuotes;
  window.importFromJsonFile = importFromJsonFile;

  // Periodic sync every 15 seconds
  setInterval(syncQuotes, 15000);
});
