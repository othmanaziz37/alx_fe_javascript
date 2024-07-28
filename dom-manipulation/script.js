document.addEventListener('DOMContentLoaded', () => {
    let quotes = JSON.parse(localStorage.getItem('quotes')) || [
      { text: 'The best way to predict the future is to invent it.', category: 'Inspiration' },
      { text: 'Life is 10% what happens to us and 90% how we react to it.', category: 'Motivation' },
    ];
  
    const serverUrl = 'https://jsonplaceholder.typicode.com/posts';
  
    function saveQuotes() {
      localStorage.setItem('quotes', JSON.stringify(quotes));
    }
  
    function getUniqueCategories() {
      const categoriesSet = new Set();
      quotes.forEach(quote => categoriesSet.add(quote.category));
      return Array.from(categoriesSet);
    }
  
    function populateCategories() {
      const dropdown = document.getElementById('categoryFilter');
      dropdown.innerHTML = '<option value="all">All Categories</option>';
      getUniqueCategories().forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        dropdown.appendChild(option);
      });
  
      const lastSelectedCategory = localStorage.getItem('selectedCategory');
      if (lastSelectedCategory) {
        dropdown.value = lastSelectedCategory;
      }
    }
  
    function filterQuotes() {
      const selectedCategory = document.getElementById('categoryFilter').value;
      localStorage.setItem('selectedCategory', selectedCategory);
      const filteredQuotes = selectedCategory === 'all'
        ? quotes
        : quotes.filter(quote => quote.category === selectedCategory);
  
      if (filteredQuotes.length === 0) {
        document.getElementById('quoteDisplay').innerHTML = 'No quotes available.';
        return;
      }
      const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
      const quote = filteredQuotes[randomIndex];
      document.getElementById('quoteDisplay').innerHTML = `"${quote.text}" - ${quote.category}`;
      sessionStorage.setItem('lastQuote', JSON.stringify(quote));
    }
  
    function showRandomQuote() {
      filterQuotes();
    }
  
    async function addQuote() {
      const newQuoteText = document.getElementById('newQuoteText').value;
      const newQuoteCategory = document.getElementById('newQuoteCategory').value;
      if (newQuoteText && newQuoteCategory) {
        const newQuote = { text: newQuoteText, category: newQuoteCategory };
        quotes.push(newQuote);
        document.getElementById('newQuoteText').value = '';
        document.getElementById('newQuoteCategory').value = '';
        saveQuotes();
        populateCategories();
        alert('New quote added successfully!');
        await postQuoteToServer(newQuote); // Post the new quote to the server
      } else {
        alert('Please enter both a quote and a category.');
      }
    }
  
    function createAddQuoteForm() {
      const formDiv = document.createElement('div');
  
      const quoteTextInput = document.createElement('input');
      quoteTextInput.id = 'newQuoteText';
      quoteTextInput.type = 'text';
      quoteTextInput.placeholder = 'Enter a new quote';
  
      const quoteCategoryInput = document.createElement('input');
      quoteCategoryInput.id = 'newQuoteCategory';
      quoteCategoryInput.type = 'text';
      quoteCategoryInput.placeholder = 'Enter quote category';
  
      const addButton = document.createElement('button');
      addButton.textContent = 'Add Quote';
      addButton.onclick = addQuote;
  
      formDiv.appendChild(quoteTextInput);
      formDiv.appendChild(quoteCategoryInput);
      formDiv.appendChild(addButton);
  
      document.body.appendChild(formDiv);
    }
  
    function exportQuotes() {
      const dataStr = JSON.stringify(quotes, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
  
      const a = document.createElement('a');
      a.href = url;
      a.download = 'quotes.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  
    function importFromJsonFile(event) {
      const fileReader = new FileReader();
      fileReader.onload = function(event) {
        const importedQuotes = JSON.parse(event.target.result);
        quotes.push(...importedQuotes);
        saveQuotes();
        populateCategories();
        alert('Quotes imported successfully!');
      };
      fileReader.readAsText(event.target.files[0]);
    }
  
    async function fetchQuotesFromServer() {
      try {
        const response = await fetch(serverUrl);
        const serverQuotes = await response.json();
        const serverQuoteTexts = serverQuotes.map(quote => quote.text);
        const newQuotes = serverQuotes.filter(quote => !serverQuoteTexts.includes(quote.text));
        if (newQuotes.length > 0) {
          quotes.push(...newQuotes);
          saveQuotes();
          populateCategories();
          showNotification('New quotes fetched from the server.');
        }
      } catch (error) {
        console.error('Error fetching quotes from server:', error);
      }
    }
  
    async function postQuoteToServer(newQuote) {
      try {
        const response = await fetch(serverUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newQuote)
        });
        console.log('Quote posted to server:', await response.json());
      } catch (error) {
        console.error('Error posting quote to server:', error);
      }
    }
  
    async function syncQuotes() {
      try {
        const response = await fetch(serverUrl);
        const serverQuotes = await response.json();
  
        // Conflict resolution: server data takes precedence
        const serverQuoteTexts = serverQuotes.map(quote => quote.text);
        quotes = quotes.filter(quote => !serverQuoteTexts.includes(quote.text));
        quotes.push(...serverQuotes);
  
        saveQuotes();
        populateCategories();
        showNotification('Quotes synced with server!');
      } catch (error) {
        console.error('Error synchronizing quotes with server:', error);
      }
    }
  
    function showNotification(message) {
      const notificationDiv = document.getElementById('notification');
      notificationDiv.textContent = message;
      setTimeout(() => {
        notificationDiv.textContent = '';
      }, 3000);
    }
  
    document.getElementById('newQuote').addEventListener('click', showRandomQuote);
    document.getElementById('exportQuotes').addEventListener('click', exportQuotes);
    document.getElementById('categoryFilter').addEventListener('change', filterQuotes);
  
    createAddQuoteForm();
    populateCategories();
  
    const lastQuote = JSON.parse(sessionStorage.getItem('lastQuote'));
    if (lastQuote) {
      document.getElementById('quoteDisplay').innerHTML = `"${lastQuote.text}" - ${lastQuote.category}`;
    } else {
      showRandomQuote();
    }
  
    setInterval(syncQuotes, 60000); // Sync every 60 seconds
  });
  