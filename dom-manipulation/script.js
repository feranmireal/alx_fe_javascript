// Array of quotes with text and category
let quotes = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Don’t let yesterday take up too much of today.", category: "Wisdom" },
  { text: "It’s not whether you get knocked down, it’s whether you get up.", category: "Resilience" }
];

// Function to display a random quote
function displayRandomQuote() {
  let randomIndex = Math.floor(Math.random() * quotes.length);
  let randomQuote = quotes[randomIndex];

  // ✅ Use innerHTML as required
  document.getElementById("quoteDisplay").innerHTML = `
    <p>"${randomQuote.text}"</p>
    <p><em>— ${randomQuote.category}</em></p>
  `;
}

// Function to add a new quote
function addQuote() {
  let quoteText = document.getElementById("newQuoteText").value;
  let quoteCategory = document.getElementById("newQuoteCategory").value;

  if (quoteText && quoteCategory) {
    let newQuote = { text: quoteText, category: quoteCategory };
    quotes.push(newQuote);

    // Show the newly added quote immediately
    document.getElementById("quoteDisplay").innerHTML = `
      <p>"${newQuote.text}"</p>
      <p><em>— ${newQuote.category}</em></p>
    `;

    // Clear inputs
    document.getElementById("newQuoteText").value = "";
    document.getElementById("newQuoteCategory").value = "";
  } else {
    alert("Please enter both text and category for the quote.");
  }
}

// Event listener for the "Show New Quote" button
document.getElementById("newQuoteBtn").addEventListener("click", displayRandomQuote);

// Event listener for the "Add Quote" button
document.getElementById("addQuoteBtn").addEventListener("click", addQuote);
