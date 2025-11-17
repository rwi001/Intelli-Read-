// ===== API CONFIGURATION =====
const API_URL = '/api/books';
// const IMG_BASE_URL = '/uploads/books/';
// const PDF_BASE_URL = '/uploads/pdfs/';

// ===== GLOBAL VARIABLES =====
let currentUser = null;
let recommendedBooks = [];
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
    { "id": "classics", "name": "Classics" }
];

let selectedGenre = [];
let currentPage = 1;
let totalPages = 1;
let currentQuery = '';

// ===== PAGE DETECTION =====
const isBookScreen = document.getElementById('recommended-container') !== null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📚 Intelli-Read Initializing...');
    
    initializeGenres();
    initializeCommonFeatures();
    
    if (isBookScreen) {
        console.log('🔍 BookScreen Page Detected');
        initializeBookScreen();
    } else {
        console.log('📖 Books Page Detected');
        initializeBooksPage();
    }
});

// ===== BOOKSCREEN PAGE =====
async function initializeBookScreen() {
    try {
        await initializeUserSession();
        await loadRecommendedBooks();
        await loadDatabaseBooks();
    } catch (error) {
        console.error('Error initializing book screen:', error);
        await loadDatabaseBooks(); // Still load books even if recommendations fail
    }
}

// ===== BOOKS PAGE =====
function initializeBooksPage() {
    loadDatabaseBooks();
    setupSearchHandler();
}

async function loadDatabaseBooks(query = '', page = 1) {
    const main = document.getElementById('main');
    if (!main) return;
    
    try {
        main.innerHTML = '<div class="loading">📚 Loading books from database...</div>';
        
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '30',
            status: 'approved'
        });
        
        if (query) params.append('search', query);
        if (selectedGenre.length > 0) params.append('genres', selectedGenre.join(','));
        
        const response = await fetch(`${API_URL}?${params}`);
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.books && data.books.length > 0) {
                // ✅ YEH LINE ADD KARO - totalPages set karo
                totalPages = data.totalPages || Math.ceil(data.totalCount / 20) || 1;
                currentPage = page; // ✅ Current page update karo
                
                renderBooks(data.books, 'main');
                updatePagination(); // ✅ Ye function call karo
            } else {
                showNoBooksMessage(main);
                updatePagination(); // ✅ Empty case mein bhi call karo
            }
        } else {
            throw new Error('API request failed');
        }
        
    } catch (error) {
        console.error('Error loading database books:', error);
        const main = document.getElementById('main');
        if (main) {
            main.innerHTML = `
                <div class="no-results">
                    <h2>⚠️ Connection Error</h2>
                    <p>Unable to load books from database. Please try again later.</p>
                </div>
            `;
        }
        updatePagination(); // ✅ Error case mein bhi call karo
    }
}

// ===== RECOMMENDED BOOKS FUNCTIONS =====
async function loadRecommendedBooks() {
    const container = document.getElementById('recommended-container');
    if (!container) return;
    
    try {
        const response = await fetch('/api/user/recommendations');
        
        if (response.ok) {
            const data = await response.json();
            recommendedBooks = data.recommendations || [];
        }
        
        // If no recommendations from API, use some database books as recommendations
        if (recommendedBooks.length === 0) {
            const dbResponse = await fetch(`${API_URL}?limit=8&status=approved`);
            if (dbResponse.ok) {
                const dbData = await dbResponse.json();
                if (dbData.success && dbData.books) {
                    recommendedBooks = dbData.books.slice(0, 8);
                }
            }
        }
        
        renderRecommendedBooks();
        
    } catch (error) {
        console.error('Error loading recommendations:', error);
        // Try to get some database books for recommendations
        try {
            const dbResponse = await fetch(`${API_URL}?limit=6&status=approved`);
            if (dbResponse.ok) {
                const dbData = await dbResponse.json();
                if (dbData.success && dbData.books) {
                    recommendedBooks = dbData.books.slice(0, 6);
                    renderRecommendedBooks();
                }
            }
        } catch (dbError) {
            console.error('Failed to load fallback recommendations:', dbError);
        }
    }
}

// ===== RENDER FUNCTIONS =====
function renderBooks(books, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    console.log(`🎨 Rendering ${books.length} books in ${containerId}`);
    container.innerHTML = '';

    if (books.length === 0) {
        showNoBooksMessage(container);
        return;
    }

    books.forEach(book => {
        const bookEl = createBookElement(book);
        container.appendChild(bookEl);
    });
}

function renderRecommendedBooks() {
    const container = document.getElementById('recommended-container');
    if (!container) return;
    
    console.log('⭐ Rendering recommended books:', recommendedBooks.length);
    container.innerHTML = '';

    if (recommendedBooks.length === 0) {
        container.innerHTML = '<p class="no-recommendations">No recommendations available</p>';
        return;
    }

    recommendedBooks.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        
        // ✅ CORRECTED: Use path directly from API
        const imageUrl = book.imagePath ? book.imagePath : '/images/default-book.jpg';
        
        bookCard.innerHTML = `
            <img src="${imageUrl}" alt="${book.title}" onerror="this.src='/images/default-book.jpg'">
            <h3>${book.title}</h3>
            <p class="author">${book.author}</p>
            <div class="book-description">
                <p>${book.description || 'No description available'}</p>
            </div>
        `;
        
        bookCard.addEventListener('click', () => showBookDetails(book));
        container.appendChild(bookCard);
    });
}

function createBookElement(book) {
    const bookEl = document.createElement('div');
    bookEl.classList.add('book');
    bookEl.setAttribute('data-id', book.id);

    // ✅ CORRECTED: Use the path directly from API response
    const imageUrl = book.imagePath ? book.imagePath : '/images/default-book.jpg';
    const pdfUrl = book.filePath ? book.filePath : null;

    bookEl.innerHTML = `
        <div class="book-image-container">
            <img src="${imageUrl}" alt="${book.title}" onerror="this.src='/images/default-book.jpg'">
        </div>
        <div class="book-info">
            <h3>${book.title}</h3>
            <p class="book-author">by ${book.author || 'Unknown Author'}</p>
            <span class="book-genre">${book.genre}</span>
        </div>
        
        <div class="book-overlay">
            <div class="overlay-content">
                <h3 class="overlay-title">${book.title}</h3>
                <p class="overlay-author"><strong>Author:</strong> ${book.author || 'Unknown Author'}</p>
                <p class="overlay-year"><strong>Published:</strong> ${book.publicationYear || 'N/A'}</p>
                <p class="overlay-genre"><strong>Genre:</strong> ${book.genre || 'General'}</p>
               
                
            </div>
        </div>
    `;

    bookEl.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
            showBookDetails(book);
        }
    });
    
    return bookEl;
}

function showNoBooksMessage(container) {
    container.innerHTML = `
        <div class="no-results">
            <h2>📖 No Books Found</h2>
            <p>No approved books available in the database.</p>
            <p>Please check back later or contact administrator.</p>
        </div>
    `;
}

// ===== GENRES =====
function initializeGenres() {
    const tagsEl = document.getElementById('tags');
    if (!tagsEl) return;
    
    tagsEl.innerHTML = '';
    
    genres.forEach(genre => {
        const tag = document.createElement('div');
        tag.classList.add('tag');
        tag.id = genre.id;
        tag.innerText = genre.name;
        tag.addEventListener('click', () => {
            toggleGenreSelection(genre.id);
        });
        tagsEl.appendChild(tag);
    });
}

function toggleGenreSelection(genreId) {
    if (selectedGenre.includes(genreId)) {
        selectedGenre = selectedGenre.filter(id => id !== genreId);
    } else {
        selectedGenre.push(genreId);
    }
    highlightSelectedGenres();
    currentPage = 1;
    
    if (isBookScreen) {
        loadDatabaseBooks(currentQuery);
    } else {
        loadDatabaseBooks(currentQuery);
    }
}

function highlightSelectedGenres() {
    const tags = document.querySelectorAll('.tag');
    tags.forEach(tag => tag.classList.remove('highlight'));
    selectedGenre.forEach(id => {
        const tagElement = document.getElementById(id);
        if (tagElement) {
            tagElement.classList.add('highlight');
        }
    });
}

// ===== USER SESSION =====
async function initializeUserSession() {
    try {
        const response = await fetch('/api/auth/status');
        if (!response.ok) throw new Error('Auth check failed');
        
        const data = await response.json();
        
        if (data.success && data.isLoggedIn && data.user && !data.isAdmin) {
            currentUser = data.user;
            const usernameElement = document.getElementById('username');
            if (usernameElement) {
                usernameElement.textContent = currentUser.fullName || currentUser.email;
            }
            return currentUser;
        } else {
            window.location.href = '/login';
            return null;
        }
    } catch (error) {
        console.log('Auth check failed, redirecting to login');
        window.location.href = '/login';
        return null;
    }
}

// ===== SEARCH =====
function setupSearchHandler() {
    const form = document.getElementById('form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const searchInput = document.getElementById('search');
            currentPage = 1;
            currentQuery = searchInput.value;
            loadDatabaseBooks(currentQuery);
        });
    }
}

// ===== READ BOOK =====
function readBook(pdfUrl) {
    if (!pdfUrl) {
        showNotification('This book is not available for reading yet.', false);
        return;
    }
    window.open(pdfUrl, '_blank');
}

// ===== PAGINATION =====
function updatePagination() {
    let paginationEl = document.querySelector('.pagination');
    if (!paginationEl) {
        const main = document.getElementById('main');
        if (!main) return;
        
        paginationEl = document.createElement('div');
        paginationEl.classList.add('pagination');
        main.insertAdjacentElement('afterend', paginationEl);
    }

    
    paginationEl.innerHTML = `
        <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} id="prev">
            ← Prev
        </button>
        <div class="page-numbers">
            <div class="page-circle">${currentPage}</div>
        </div>
        <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} id="next">
            Next →
        </button>
    `;

    document.getElementById('prev')?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadDatabaseBooks(currentQuery, currentPage);
        }
    });

    document.getElementById('next')?.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadDatabaseBooks(currentQuery, currentPage);
        }
    });
}

// ===== MODAL SYSTEM =====
let modal, modalBody;

function initializeModal() {
    if (document.querySelector('.modal')) return;
    
    modal = document.createElement('div');
    modal.classList.add('modal');
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-btn">&times;</span>
            <div class="modal-body"></div>
        </div>
    `;
    document.body.appendChild(modal);

    modalBody = modal.querySelector('.modal-body');
    const closeBtn = modal.querySelector('.close-btn');

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}

function closeModal() {
    modal.classList.remove('active');
}

function showBookDetails(book) {
    initializeModal();
    
    // ✅ CORRECTED: Use path directly from API
    const imageUrl = book.imagePath ? book.imagePath : '/images/default-book.jpg';
    const pdfUrl = book.filePath ? book.filePath : null;

    modalBody.innerHTML = `
        <div class="modal-header">
            <h2>${book.title}</h2>
            <p class="modal-subtitle">by ${book.author || 'Unknown Author'}</p>
        </div>
        <div class="modal-body-content">
            <div class="modal-cover-container">
                <img src="${imageUrl}" alt="${book.title}" class="modal-cover" 
                     onerror="this.src='/images/default-book.jpg'">
            </div>
            <div class="modal-info">
                <div class="book-meta">
                    <p><strong>Publication Year:</strong> ${book.publicationYear || 'N/A'}</p>
                    <p><strong>Genre:</strong> ${book.genre || 'General'}</p>
                    <p><strong>ISBN:</strong> ${book.isbn || 'N/A'}</p>
                    <p><strong>Pages:</strong> ${book.pages || 'N/A'}</p>
                    <p><strong>Status:</strong> <span class="status-approved">Approved</span></p>
                </div>
                <div class="book-description-full">
                    <h4>Description</h4>
                    <p>${book.description || 'No description available for this book.'}</p>
                </div>
                <div class="modal-actions">
                    ${pdfUrl ? 
                        `<button class="btn-primary read-btn-large" onclick="readBook('${pdfUrl}')">
                            <i class='bx bx-book-reader'></i> Read Book
                        </button>` 
                        : 
                        '<p class="no-pdf-message">📚 Digital version not available</p>'
                    }
                    <button class="btn-secondary close-modal-btn" onclick="closeModal()">
                        <i class='bx bx-x'></i> Close
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, isSuccess = true) {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${isSuccess ? 'success' : 'error'}`;
    
    notification.innerHTML = `
        <div class="notification-icon">
            <i class='bx ${isSuccess ? 'bx-check-circle' : 'bx-error-circle'}'></i>
        </div>
        <div class="notification-content">${message}</div>
        <button class="notification-close">
            <i class='bx bx-x'></i>
        </button>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        removeNotification(notification);
    }, 5000);
    
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        removeNotification(notification);
    });
}

function removeNotification(notification) {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// ===== COMMON FEATURES =====
function initializeCommonFeatures() {
    initializeUserMenu();
    initializeMobileSearch();
}

function initializeUserMenu() {
    const userMenu = document.getElementById('userMenu');
    const dropdown = document.getElementById('dropdownMenu');
    const logoutBtn = document.getElementById('logoutBtn');

    if (userMenu && dropdown) {
        userMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!userMenu.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const response = await fetch('/api/logout', { method: 'POST' });
                const data = await response.json();
                
                if (data.success) {
                    showNotification("Logged out successfully!");
                    setTimeout(() => window.location.href = "/login", 1500);
                } else {
                    showNotification("Logout failed. Please try again.", false);
                }
            } catch (error) {
                showNotification("Logout failed. Please try again.", false);
            }
        });
    }
}

function initializeMobileSearch() {
    const searchForm = document.querySelector('.search-form');
    const searchButton = document.querySelector('.search-form button');

    if (searchForm && searchButton) {
        searchButton.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && !searchForm.classList.contains('active')) {
                e.preventDefault();
                searchForm.classList.add('active');
                document.getElementById('search')?.focus();
            }
        });

        document.addEventListener('click', (e) => {
            if (!searchForm.contains(e.target) && searchForm.classList.contains('active')) {
                searchForm.classList.remove('active');
            }
        });
    }
}

// Global functions
window.readBook = readBook;
window.showBookDetails = showBookDetails;
window.closeModal = closeModal;

console.log('✅ BookScript.js loaded successfully!');