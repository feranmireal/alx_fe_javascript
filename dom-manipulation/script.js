// Initial quotes
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The best way to get started is to quit talking and begin doing.", author: "Walt Disney", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon", category: "Life" },
  { text: "Do not watch the clock. Do what it does. Keep going.", author: "Sam Levenson", category: "Time" }
];

// Display quotes on page load
window.onload = function() {
  populateCategories();
  restoreFilter();
  displayQuotes();
};

// Populate categories dynamically into the dropdown
function populateCategories() {
  const categoryFilter = document.getElementById("categoryFilter");
  const uniqueCategories = [...new Set(quotes.map(q => q.category))];

  // Clear old options except "All"
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;

  uniqueCategories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

// Display quotes based on filter
function displayQuotes() {
  const container = document.getElementById("quoteContainer");
  container.innerHTML = "";
  const selectedCategory = localStorage.getItem("selectedCategory") || "all";

  let filteredQuotes = quotes;
  if (selectedCategory !== "all") {
    filteredQuotes = quotes.filter(q => q.category === selectedCategory);
  }

  filteredQuotes.forEach(quote => {
    const div = document.createElement("div");
    div.classList.add("quote");
    div.innerHTML = `"${quote.text}" <div class="author">- ${quote.author} (${quote.category})</div>`;
    container.appendChild(div);
  });

  // Keep dropdown in sync
  document.getElementById("categoryFilter").value = selectedCategory;
}

// Save and apply selected filter
function filterQuotes() {
  const category = document.getElementById("categoryFilter").value;
  localStorage.setItem("selectedCategory", category);
  displayQuotes();
}

// Restore last selected filter from localStorage
function restoreFilter() {
  const savedFilter = localStorage.getItem("selectedCategory");
  if (savedFilter) {
    document.getElementById("categoryFilter").value = savedFilter;
  }
}

// Add new quote and update storage
document.getElementById("quoteForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const newQuote = document.getElementById("newQuote").value;
  const newAuthor = document.getElementById("newAuthor").value;
  const newCategory = document.getElementById("newCategory").value;

  if (newQuote && newAuthor && newCategory) {
    const quoteObj = { text: newQuote, author: newAuthor, category: newCategory };
    quotes.push(quoteObj);

    // Save to localStorage
    localStorage.setItem("quotes", JSON.stringify(quotes));

    // Update categories if new one is added
    populateCategories();

    // Refresh displayed quotes
    displayQuotes();

    // Reset form
    document.getElementById("quoteForm").reset();
  }
});
