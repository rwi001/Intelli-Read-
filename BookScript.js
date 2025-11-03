// ===== OPEN LIBRARY API CONFIG =====
const API_URL = 'https://openlibrary.org/search.json?q=';
const IMG_URL = 'https://covers.openlibrary.org/b/id/';
const searchURL = 'https://openlibrary.org/search.json';

const genres = [
  { "id": "fiction", "name": "Fiction" },
  { "id": "fantasy", "name": "Fantasy" },
  { "id": "science", "name": "Science" },
  { "id": "history", "name": "History" },
  { "id": "romance", "name": "Romance" },
  { "id": "mystery", "name": "Mystery" },
  { "id": "horror", "name": "Horror" },
  { "id": "adventure", "name": "Adventure" },
  { "id": "biography", "name": "Biography" },
  { "id": "thriller", "name": "Thriller" },
  { "id": "children", "name": "Children" },
  { "id": "young_adult", "name": "Young Adult" },
  { "id": "classics", "name": "Classics" },
  { "id": "poetry", "name": "Poetry" },
  { "id": "drama", "name": "Drama" },
  { "id": "comedy", "name": "Comedy" },
  { "id": "crime", "name": "Crime" },
  { "id": "graphic_novels", "name": "Graphic Novels" },
  { "id": "cookbooks", "name": "Cookbooks" },
  { "id": "self_help", "name": "Self Help" },
  { "id": "business", "name": "Business" },
  { "id": "philosophy", "name": "Philosophy" },
  { "id": "art", "name": "Art" },
  { "id": "travel", "name": "Travel" }
];

const main = document.getElementById('main');
const form = document.getElementById('form');
const search = document.getElementById('search');
const tagsEl = document.getElementById('tags');
const paginationEl = document.createElement('div');
paginationEl.classList.add('pagination');
main.insertAdjacentElement('afterend', paginationEl);

let selectedGenre = [];
let currentPage = 1;
let totalPages = 1;
let currentQuery = '';

setGenre();

// ===== GENRE FILTER =====
function setGenre() {
  tagsEl.innerHTML = '';
  genres.forEach(genre => {
    const t = document.createElement('div');
    t.classList.add('tag');
    t.id = genre.id;
    t.innerText = genre.name;
    t.addEventListener('click', () => {
      if (selectedGenre.includes(genre.id)) {
        selectedGenre = selectedGenre.filter(id => id !== genre.id);
      } else {
        selectedGenre.push(genre.id);
      }
      highlightSelection();
      currentPage = 1;
      fetchBooks();
    });
    tagsEl.appendChild(t);
  });
}

function highlightSelection() {
  const tags = document.querySelectorAll('.tag');
  tags.forEach(tag => tag.classList.remove('highlight'));
  selectedGenre.forEach(id => {
    document.getElementById(id).classList.add('highlight');
  });
}

// ===== FETCH BOOKS =====
function fetchBooks(query = '', page = 1) {
  currentQuery = query || selectedGenre.join(' ') || 'bestseller';
  const url = `${searchURL}?q=${currentQuery}&page=${page}`;
  
  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data.docs.length > 0) {
        totalPages = Math.ceil(data.num_found / 100);
        showBooks(data.docs);
        updatePagination();
      } else {
        main.innerHTML = `<h1 class="no-results">No Results Found</h1>`;
      }
    })
    .catch(err => console.error("Error fetching books:", err));
}

// ===== GET BOOK DESCRIPTION =====
function getBookDescription(book) {
  // Try to get description from different possible fields
  if (book.description) {
    if (typeof book.description === 'string') {
      const desc = book.description.length > 150 
        ? book.description.substring(0, 150) + '...' 
        : book.description;
      return desc || 'No description available.';
    } else if (book.description.value) {
      const desc = book.description.value.length > 150 
        ? book.description.value.substring(0, 150) + '...' 
        : book.description.value;
      return desc || 'No description available.';
    }
  }
  
  // Additional description fields to check
  if (book.first_sentence && typeof book.first_sentence === 'string') {
    return `Starts with: "${book.first_sentence.substring(0, 120)}..."`;
  }
  
  if (book.first_sentence && Array.isArray(book.first_sentence)) {
    return `Starts with: "${book.first_sentence[0].substring(0, 120)}..."`;
  }
  
  // Fallback descriptions based on available data
  if (book.author_name && book.author_name.length > 0) {
    return `A book by ${book.author_name.join(', ')}.`;
  }
  
  if (book.subject && book.subject.length > 0) {
    const mainSubjects = book.subject.slice(0, 2).join(' and ');
    return `A ${book.subject[0]?.toLowerCase() || 'fiction'} book${mainSubjects ? ' about ' + mainSubjects : ''}.`;
  }
  
  return 'Description not available. Click for more details.';
}

// ===== GET BOOK GENRES/SUBJECTS =====
function getBookGenres(book) {
  // Try multiple possible fields for genres/subjects
  if (book.subject && book.subject.length > 0) {
    return book.subject.slice(0, 3).join(', ');
  }
  
  if (book.subject_facet && book.subject_facet.length > 0) {
    return book.subject_facet.slice(0, 3).join(', ');
  }
  
  if (book.genre && book.genre.length > 0) {
    return book.genre.slice(0, 3).join(', ');
  }
  
  // Try to infer from title or other fields
  if (book.title) {
    const titleLower = book.title.toLowerCase();
    if (titleLower.includes('cook') || titleLower.includes('recipe')) return 'Cooking';
    if (titleLower.includes('history')) return 'History';
    if (titleLower.includes('science')) return 'Science';
    if (titleLower.includes('love') || titleLower.includes('romance')) return 'Romance';
    if (titleLower.includes('mystery') || titleLower.includes('detective')) return 'Mystery';
    if (titleLower.includes('fantasy')) return 'Fantasy';
    if (titleLower.includes('horror') || titleLower.includes('ghost')) return 'Horror';
  }
  
  return 'General Fiction';
}

// ===== DISPLAY BOOKS WITH HOVER OVERLAY =====
function showBooks(books) {
  main.innerHTML = '';

  books.forEach(book => {
    const { title, author_name, cover_i, first_publish_year } = book;

    const bookEl = document.createElement('div');
    bookEl.classList.add('book');

    // Main book content - ONLY IMAGE AND TITLE (visible by default)
    bookEl.innerHTML = `
      <img src="${cover_i ? IMG_URL + cover_i + '-L.jpg' : 'http://via.placeholder.com/250x350'}" alt="${title}">
      <div class="book-info">
        <h3>${title}</h3>
      </div>
      
      <!-- Hover Overlay - Shows all details on hover -->
      <div class="book-overlay">
        <div class="overlay-content">
          <h3 class="overlay-title">${title}</h3>
          <p class="overlay-author"><strong>Author:</strong> ${author_name ? author_name.join(', ') : 'Unknown Author'}</p>
          <p class="overlay-year"><strong>Year:</strong> ${first_publish_year || 'N/A'}</p>
          <p class="overlay-genre"><strong>Genre:</strong> ${getBookGenres(book)}</p>
          <p class="overlay-description"><strong>Description:</strong> ${getBookDescription(book)}</p>
        </div>
      </div>
    `;

    // Click opens modal with full details
    bookEl.addEventListener('click', () => showBookDetails(book));

    main.appendChild(bookEl);
  });
}

// ===== PAGINATION =====
function updatePagination() {
  paginationEl.innerHTML = `
    <button ${currentPage === 1 ? 'disabled' : ''} id="prev">⬅ Prev</button>
    <span>Page ${currentPage} of ${totalPages}</span>
    <button ${currentPage === totalPages ? 'disabled' : ''} id="next">Next ➡</button>
  `;

  document.getElementById('prev').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      fetchBooks(currentQuery, currentPage);
    }
  });

  document.getElementById('next').addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      fetchBooks(currentQuery, currentPage);
    }
  });
}

// ===== SEARCH FORM =====
form.addEventListener('submit', (e) => {
  e.preventDefault();
  currentPage = 1;
  fetchBooks(search.value);
});

// ===== INITIAL LOAD =====
fetchBooks();

// ===== MODAL POPUP =====
const modal = document.createElement('div');
modal.classList.add('modal');
modal.innerHTML = `
  <div class="modal-content">
    <span class="close-btn">&times;</span>
    <div class="modal-body"></div>
  </div>
`;
document.body.appendChild(modal);

const modalBody = modal.querySelector('.modal-body');
const closeBtn = modal.querySelector('.close-btn');

closeBtn.addEventListener('click', () => modal.classList.remove('active'));
modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.classList.remove('active');
});

function showBookDetails(book) {
  const { title, author_name, cover_i, first_publish_year, key } = book;

  modalBody.innerHTML = `
    <img src="${cover_i ? IMG_URL + cover_i + '-L.jpg' : 'http://via.placeholder.com/250x350'}" 
         alt="${title}" class="modal-cover">
    <div class="modal-info">
      <h2>${title}</h2>
      <h4>by ${author_name ? author_name.join(', ') : 'Unknown Author'}</h4>
      <p><strong>First Published:</strong> ${first_publish_year || 'N/A'}</p>
      <p><strong>Subjects:</strong> ${getBookGenres(book)}</p>
      <p><strong>Description:</strong> ${getBookDescription(book)}</p>
      <a href="https://openlibrary.org${key}" target="_blank" class="read-more">📖 Read More on Open Library</a>
    </div>
  `;
  modal.classList.add('active');
}