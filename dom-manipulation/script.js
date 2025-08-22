// Ensure everything runs after the DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  // 1) Quotes array with objects containing text and category
  const quotes = [
    { text: "The best way to predict the future is to create it.", category: "Inspiration" },
    { text: "It always seems impossible until it's done.", category: "Motivation" },
    { text: "Failure is simply the opportunity to begin again.", category: "Resilience" },
    { text: "Do one thing every day that scares you.", category: "Growth" }
  ];

  // Cache key DOM nodes
  const quoteDisplay = document.getElementById('quoteDisplay');
  const showNewQuoteBtn = document.getElementById('newQuote');

  // 2) Function to display a random quote and update the DOM with innerHTML
  function showRandomQuote() {
    if (quotes.length === 0) {
      quoteDisplay.innerHTML = "No quotes available. Add one below!";
      return;
    }
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const q = quotes[randomIndex];
    quoteDisplay.innerHTML = `"${q.text}"<br><em>- ${q.category}</em>`;
  }

  // 3) Function to add a new quote to the array and update the DOM
  function addQuote() {
    const textInput = document.getElementById('newQuoteText');
    const categoryInput = document.getElementById('newQuoteCategory');

    const text = (textInput?.value || "").trim();
    const category = (categoryInput?.value || "").trim();

    if (!text || !category) {
      alert("Please enter both a quote and a category.");
      return;
    }

    quotes.push({ text, category });

    // Update the display to show the newly added quote
    quoteDisplay.innerHTML = `"${text}"<br><em>- ${category}</em>`;

    // Clear inputs
    textInput.value = "";
    categoryInput.value = "";
  }

  // 4) Function to dynamically create the form UI (matches task requirement)
  function createAddQuoteForm() {
    const container = document.createElement('div');

    const quoteInput = document.createElement('input');
    quoteInput.type = 'text';
    quoteInput.id = 'newQuoteText';
    quoteInput.placeholder = 'Enter a new quote';

    const categoryInput = document.createElement('input');
    categoryInput.type = 'text';
    categoryInput.id = 'newQuoteCategory';
    categoryInput.placeholder = 'Enter quote category';

    const addBtn = document.createElement('button');
    addBtn.textContent = 'Add Quote';
    // The task snippet uses inline onclick, so set it explicitly:
    addBtn.setAttribute('onclick', 'addQuote()');

    container.appendChild(quoteInput);
    container.appendChild(categoryInput);
    container.appendChild(addBtn);

    // Append just after the Show New Quote button
    showNewQuoteBtn.insertAdjacentElement('afterend', container);
  }

  // 5) Event listener on the “Show New Quote” button
  showNewQuoteBtn.addEventListener('click', showRandomQuote);

  // 6) Expose addQuote globally so the inline onclick works
  window.addQuote = addQuote;

  // 7) Build the dynamic form and show an initial quote
  createAddQuoteForm();
  showRandomQuote();
});
