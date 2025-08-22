// Load quotes from localStorage or start fresh
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Don’t let yesterday take up too much of today.", category: "Wisdom" },
  { text: "It’s not whether you get knocked down, it’s whether you get up.", category: "Resilience" }
];

// Function to display a random quote
function displayRandomQuote() {
  let randomIndex = Math.floor(Math.random() * quotes.length);
  let quote = quotes[randomIndex];
  document.getElementById("quoteDisplay").innerHTML = `"${quote.text}" - <em>${quote.category}</em>`;

  // Save last shown quote in sessionStorage
  sessionStorage.setItem("lastQuote", JSON.stringify(quote));
}

// Function to add a new quote
function addQuote() {
  let text = document.getElementById("quoteText").value.trim();
  let category = document.getElementById("quoteCategory").value.trim();

  if (text && category) {
    let newQuote = { text, category };
    quotes.push(newQuote);

    // Save to localStorage
    localStorage.setItem("quotes", JSON.stringify(quotes));

    // Update DOM
    document.getElementById("quoteDisplay").innerHTML = `"${newQuote.text}" - <em>${newQuote.category}</em>`;
    
    // Clear inputs
    document.getElementById("quoteText").value = "";
    document.getElementById("quoteCategory").value = "";
  }
}

// Export quotes as JSON
document.getElementById("exportQuotes").addEventListener("click", function () {
  let blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
});

// Import quotes from JSON
document.getElementById("importQuotes").addEventListener("change", function (event) {
  let file = event.target.files[0];
  if (file) {
    let reader = new FileReader();
    reader.onload = function (e) {
      try {
        let importedQuotes = JSON.parse(e.target.result);
        if (Array.isArray(importedQuotes)) {
          quotes = quotes.concat(importedQuotes);
          localStorage.setItem("quotes", JSON.stringify(quotes));
          alert("Quotes imported successfully!");
        }
      } catch {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  }
});

// Event listeners
document.getElementById("newQuote").addEventListener("click", displayRandomQuote);
document.getElementById("addQuote").addEventListener("click", addQuote);

// Show last quote from sessionStorage or a random one on load
window.onload = function () {
  let lastQuote = sessionStorage.getItem("lastQuote");
  if (lastQuote) {
    let quote = JSON.parse(lastQuote);
    document.getElementById("quoteDisplay").innerHTML = `"${quote.text}" - <em>${quote.category}</em>`;
  } else {
    displayRandomQuote();
  }
};
