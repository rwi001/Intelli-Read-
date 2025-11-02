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
  { "id": "adventure", "name": "Adventure" }
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

// ===== DISPLAY BOOKS WITH HOVER TOOLTIP =====
function showBooks(books) {
  main.innerHTML = '';

  books.forEach(book => {
    const { title, author_name, cover_i, first_publish_year, subject } = book;

    const bookEl = document.createElement('div');
    bookEl.classList.add('book');

    // Main book content - ONLY TITLE VISIBLE BY DEFAULT
    bookEl.innerHTML = `
      <img src="${cover_i ? IMG_URL + cover_i + '-L.jpg' : 'http://via.placeholder.com/250x350'}" alt="${title}">
      <div class="book-info">
        <h3>${title}</h3>
        <p>${author_name ? author_name.join(', ') : 'Unknown Author'}</p>
        <span>${first_publish_year || ''}</span>
      </div>
      
      <!-- Hover Tooltip - Shows all details -->
      <div class="book-tooltip">
        <h4>${title}</h4>
        <p><strong>Author:</strong> ${author_name ? author_name.join(', ') : 'Unknown'}</p>
        <p><strong>Published:</strong> ${first_publish_year || 'N/A'}</p>
        <p><strong>Subjects:</strong> ${subject ? subject.slice(0, 3).join(', ') : 'No subjects available'}</p>
        <p><strong>Description:</strong> ${getBookDescription(book)}</p>
      </div>
    `;

    // Click opens modal
    bookEl.addEventListener('click', () => showBookDetails(book));

    main.appendChild(bookEl);
  });
}

// ===== GET BOOK DESCRIPTION =====
function getBookDescription(book) {
  // Try to get description from different possible fields
  if (book.description) {
    if (typeof book.description === 'string') {
      return book.description.length > 120 
        ? book.description.substring(0, 120) + '...' 
        : book.description;
    } else if (book.description.value) {
      return book.description.value.length > 120 
        ? book.description.value.substring(0, 120) + '...' 
        : book.description.value;
    }
  }
  
  // Fallback descriptions based on subjects
  if (book.subject && book.subject.length > 0) {
    const mainSubjects = book.subject.slice(0, 2).join(' and ');
    return `A ${book.subject[0]?.toLowerCase() || 'fiction'} book${mainSubjects ? ' about ' + mainSubjects : ''}.`;
  }
  
  return 'Description not available. Click for more details.';
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
  const { title, author_name, cover_i, first_publish_year, subject, key } = book;

  modalBody.innerHTML = `
    <img src="${cover_i ? IMG_URL + cover_i + '-L.jpg' : 'http://via.placeholder.com/250x350'}" 
         alt="${title}" class="modal-cover">
    <div class="modal-info">
      <h2>${title}</h2>
      <h4>by ${author_name ? author_name.join(', ') : 'Unknown Author'}</h4>
      <p><strong>First Published:</strong> ${first_publish_year || 'N/A'}</p>
      <p><strong>Subjects:</strong> ${subject ? subject.slice(0, 10).join(', ') : 'No subjects available'}</p>
      <p><strong>Description:</strong> ${getBookDescription(book)}</p>
      <a href="https://openlibrary.org${key}" target="_blank" class="read-more">📖 Read More on Open Library</a>
    </div>
  `;
  modal.classList.add('active');
}