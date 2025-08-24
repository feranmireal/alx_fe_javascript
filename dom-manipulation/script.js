// ======== Persistent state keys ========
const LS_QUOTES_KEY = 'quotes';
const LS_LAST_FILTER_KEY = 'lastSelectedCategory';
const SS_LAST_VIEWED_KEY = 'lastViewedQuote';

// ======== Initial data (used if no localStorage yet) ========
let quotes = [
  { text: "The best way to predict the future is to create it.", category: "motivation" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", category: "success" },
  { text: "Don’t watch the clock; do what it does. Keep going.", category: "productivity" },
];

// ======== DOM refs ========
let quoteDisplay, categoryFilter, quoteList, notifications, lastViewedNote;

// ======== Storage helpers ========
function saveQuotes() {
  localStorage.setItem(LS_QUOTES_KEY, JSON.stringify(quotes));
}

function loadQuotes() {
  const saved = localStorage.getItem(LS_QUOTES_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) quotes = parsed.filter(q => q && q.text && q.category);
    } catch (_) {}
  }
}

function saveLastFilter(value) {
  localStorage.setItem(LS_LAST_FILTER_KEY, value);
}

function loadLastFilter() {
  return localStorage.getItem(LS_LAST_FILTER_KEY) || 'all';
}

function saveLastViewedQuote(text) {
  sessionStorage.setItem(SS_LAST_VIEWED_KEY, text);
  renderLastViewedNote();
}

function renderLastViewedNote() {
  const last = sessionStorage.getItem(SS_LAST_VIEWED_KEY);
  lastViewedNote.textContent = last ? `Last viewed: "${last}"` : '';
}

// ======== UI helpers ========
function showNotification(msg) {
  notifications.textContent = msg;
  setTimeout(() => (notifications.textContent = ''), 4000);
}

function renderQuotesList(filtered = null) {
  const list = filtered || quotes;
  quoteList.innerHTML = '';
  list.forEach(q => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${q.text}</strong> <span class="small">(${q.category})</span>`;
    quoteList.appendChild(li);
  });
}

function populateCategories() {
  // gather unique categories
  const categories = Array.from(new Set(quotes.map(q => q.category))).sort();
  const current = categoryFilter.value || loadLastFilter();

  // rebuild options
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });

  // restore last selection if exists
  if ([...categoryFilter.options].some(o => o.value === current)) {
    categoryFilter.value = current;
  }

  saveLastFilter(categoryFilter.value);
}

// ======== Task-required functions ========

// Display a random quote (respect current filter if not "all")
function showRandomQuote() {
  const filter = categoryFilter.value;
  const pool = filter === 'all' ? quotes : quotes.filter(q => q.category === filter);

  if (pool.length === 0) {
    quoteDisplay.innerHTML = 'No quotes available for this category.';
    return;
    }
  const idx = Math.floor(Math.random() * pool.length);
  const q = pool[idx];
  // Requirement from earlier task: use innerHTML somewhere
  quoteDisplay.innerHTML = `<em>${q.text}</em> <span class="small">(${q.category})</span>`;
  saveLastViewedQuote(q.text);
}

// Filter quotes based on selected category (and persist filter)
function filterQuotes() {
  const selected = categoryFilter.value;
  saveLastFilter(selected);
  const filtered = selected === 'all' ? quotes : quotes.filter(q => q.category === selected);
  renderQuotesList(filtered);
  // also refresh the current displayed quote to reflect filter context
  if (filtered.length > 0) {
    quoteDisplay.innerHTML = `<em>${filtered[0].text}</em> <span class="small">(${filtered[0].category})</span>`;
    saveLastViewedQuote(filtered[0].text);
  } else {
    quoteDisplay.innerHTML = 'No quotes available for this category.';
  }
}

// Add new quote (text + category), update storage, UI, and push to server
function addQuote() {
  const textEl = document.getElementById('newQuoteText');
  const catEl = document.getElementById('newQuoteCategory');

  const text = (textEl.value || '').trim();
  const category = (catEl.value || '').trim();

  if (!text || !category) {
    alert('Please enter both quote text and category.');
    return;
  }

  const newQ = { text, category };
  quotes.push(newQ);
  saveQuotes();
  populateCategories();
  filterQuotes(); // refresh list for current filter

  // Clear inputs
  textEl.value = '';
  catEl.value = '';

  // Show it immediately
  quoteDisplay.innerHTML = `<em>${newQ.text}</em> <span class="small">(${newQ.category})</span>`;
  saveLastViewedQuote(newQ.text);

  // Simulate POST to server
  fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({ title: newQ.text, category: newQ.category })
  })
  .then(r => r.json())
  .then(() => showNotification('Quote synced to server ✅'))
  .catch(() => showNotification('⚠️ Failed to sync new quote to server'));
}

// ======== Import / Export ========
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

function importFromJsonFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error('Invalid JSON');

      // Merge + dedupe by text
      const seen = new Set(quotes.map(q => q.text));
      imported.forEach(item => {
        if (item && item.text && item.category && !seen.has(item.text)) {
          quotes.push({ text: item.text, category: item.category });
          seen.add(item.text);
        }
      });

      saveQuotes();
      populateCategories();
      filterQuotes();
      showNotification('Quotes imported successfully!');
    } catch (err) {
      alert('Invalid JSON file.');
    }
  };
  reader.readAsText(file);
}

// ======== Server Sync & Conflict Resolution ========
// Strategy: server precedence. If server provides a quote with same text,
// we keep the server's category/version.
function fetchFromServer() {
  fetch('https://jsonplaceholder.typicode.com/posts?_limit=8')
    .then(r => r.json())
    .then(data => {
      // Map server posts to quotes, synthesize categories
      const serverQuotes = data.map(item => ({
        text: item.title || `Server Quote ${item.id}`,
        category: item.userId ? `user-${item.userId}` : 'server'
      }));

      // Build map by text for quick override
      const map = new Map();
      // Start with local
      quotes.forEach(q => map.set(q.text, q));

      // Server data takes precedence: overwrite same text,
      // add new ones if not present.
      serverQuotes.forEach(sq => map.set(sq.text, sq));

      const merged = Array.from(map.values());

      const conflictsResolved = merged.length !== quotes.length ||
        merged.some((q, idx) => !quotes[idx] || q.text !== quotes[idx].text || q.category !== quotes[idx].category);

      if (conflictsResolved) {
        quotes = merged;
        saveQuotes();
        populateCategories();
        filterQuotes();
        showNotification('Server sync completed 🔄 (server precedence applied)');
      }
    })
    .catch(() => showNotification('⚠️ Failed to fetch from server'));
}

// ======== Init ========
document.addEventListener('DOMContentLoaded', function () {
  // cache DOM
  quoteDisplay    = document.getElementById('quoteDisplay');
  categoryFilter  = document.getElementById('categoryFilter');
  quoteList       = document.getElementById('quoteList');
  notifications   = document.getElementById('notifications');
  lastViewedNote  = document.getElementById('lastViewedNote');

  // load + render
  loadQuotes();
  populateCategories();
  renderQuotesList();
  renderLastViewedNote();

  // restore last chosen filter and apply
  categoryFilter.value = loadLastFilter();
  filterQuotes();

  // listeners
  document.getElementById('newQuote').addEventListener('click', showRandomQuote);
  document.getElementById('addQuoteBtn').addEventListener('click', addQuote);
  document.getElementById('exportBtn').addEventListener('click', exportToJsonFile);
  document.getElementById('manualSyncBtn').addEventListener('click', fetchFromServer);

  // periodic sync
  setInterval(fetchFromServer, 15000);
});
