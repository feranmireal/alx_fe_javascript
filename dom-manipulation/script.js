// Array to hold quotes
let quotes = [
  "The best way to get started is to quit talking and begin doing.",
  "Don’t let yesterday take up too much of today.",
  "It’s not whether you get knocked down, it’s whether you get up."
];

// Function to display a random quote
function displayRandomQuote() {
  let randomIndex = Math.floor(Math.random() * quotes.length);
  let quoteDisplay = document.getElementById("quoteDisplay");
  quoteDisplay.innerHTML = quotes[randomIndex]; // <-- uses innerHTML
}

// Function to add a new quote
function addQuote(newQuote) {
  if (newQuote.trim() !== "") {
    quotes.push(newQuote);
    displayRandomQuote(); // update DOM after adding
  }
}

// Event listener for the “Show New Quote” button
document.getElementById("newQuoteBtn").addEventListener("click", displayRandomQuote);
