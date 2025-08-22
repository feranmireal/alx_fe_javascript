// Quotes array with objects containing text and category
let quotes = [
  { text: "The best way to predict the future is to invent it.", category: "Inspiration" },
  { text: "Life is 10% what happens to us and 90% how we react to it.", category: "Motivation" },
  { text: "An investment in knowledge pays the best interest.", category: "Education" }
];

// DOM elements
const quoteContainer = document.getElementById("quoteContainer");
const newQuoteBtn = document.getElementById("newQuoteBtn");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const categoryFilter = document.getElementById("categoryFilter");

// Function: Display Random Quote
function displayRandomQuote() {
  const selectedCategory = categoryFilter.value;
  let filteredQuotes = quotes;

  if (selectedCategory !== "all") {
    filteredQuotes = quotes.filter(q => q.category === selectedCategory);
  }

  if (filteredQuotes.length === 0) {
    quoteContainer.innerHTML = "No quotes available for this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const randomQuote = filteredQuotes[randomIndex];
  quoteContainer.innerHTML = `"${randomQuote.text}" - <em>${randomQuote.category}</em>`;
}

// Function: Add a new quote
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (text && category) {
    quotes.push({ text, category });
    document.getElementById("newQuoteText").value = "";
    document.getElementById("newQuoteCategory").value = "";
    updateCategoryFilter();
    displayRandomQuote();
  }
}

// Function: Update category filter dropdown
function updateCategoryFilter() {
  const categories = ["all", ...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join("");
}

// Event Listeners
newQuoteBtn.addEventListener("click", displayRandomQuote);
addQuoteBtn.addEventListener("click", addQuote);
categoryFilter.addEventListener("change", displayRandomQuote);

// Initialize
updateCategoryFilter();
displayRandomQuote();
