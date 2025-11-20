// ===== API CONFIGURATION =====
const API_URL = '/api/books';
const USER_API_URL = '/api/user';

// ===== GLOBAL VARIABLES =====
let currentUser = null;
let recommendedBooks = [];
const genres = [
    { "id": "all", "name": "All" },
    { "id": "fiction", "name": "Fiction" },
    { "id": "non_fiction", "name": "Non-Fiction" },
    { "id": "science", "name": "Science" },
    { "id": "technology", "name": "Technology" },
    { "id": "self_help", "name": "Self-Help" },
    { "id": "business", "name": "Business" },
    { "id": "history", "name": "History" },
    { "id": "romance", "name": "Romance" },
    { "id": "fantasy", "name": "Fantasy" },
    { "id": "mystery", "name": "Mystery" },
    { "id": "horror", "name": "Horror" },
    { "id": "adventure", "name": "Adventure" },
    { "id": "biography", "name": "Biography" },
    { "id": "thriller", "name": "Thriller" },
    { "id": "children", "name": "Children" },
    { "id": "young_adult", "name": "Young Adult" },
    { "id": "classics", "name": "Classics" },
    { "id": "comics", "name": "Comics" },
    { "id": "poetry", "name": "Poetry" },
    { "id": "cooking", "name": "Cooking" },
    { "id": "art", "name": "Art" },
    { "id": "travel", "name": "Travel" },
    { "id": "health", "name": "Health" }
];

let selectedGenre = ['all'];
let currentPage = 1;
let totalPages = 1;
let currentQuery = '';
let searchTimeout = null;
let searchResultsCount = 0;

// ===== ISBN GENERATION & STORAGE =====
const generatedISBNs = new Map();

function generateISBN() {
    // Generate a random 13-digit ISBN
    const prefix = '978'; // Bookland EAN prefix
    const group = Math.floor(Math.random() * 5).toString(); // Group identifier (0-4)
    const publisher = Math.floor(Math.random() * 99999).toString().padStart(5, '0'); // Publisher code
    const title = Math.floor(Math.random() * 9999).toString().padStart(4, '0'); // Title identifier
    
    // Calculate check digit
    const isbnWithoutCheck = prefix + group + publisher + title;
    let sum = 0;
    for (let i = 0; i < isbnWithoutCheck.length; i++) {
        const digit = parseInt(isbnWithoutCheck[i]);
        sum += (i % 2 === 0) ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    
    return `${prefix}-${group}-${publisher}-${title}-${checkDigit}`;
}

function getStableISBN(book) {
    const bookId = book.id || book._id;
    
    // If book already has ISBN, use it
    if (book.isbn && book.isbn !== 'N/A') {
        generatedISBNs.set(bookId, book.isbn);
        return book.isbn;
    }
    
    // If we've already generated ISBN for this book, use the stored one
    if (generatedISBNs.has(bookId)) {
        return generatedISBNs.get(bookId);
    }
    
    // Generate new ISBN and store it
    const newISBN = generateISBN();
    generatedISBNs.set(bookId, newISBN);
    return newISBN;
}

// ===== PAGE DETECTION =====
const isBookScreen = window.location.pathname.includes('BookScreen') || 
                    document.title.includes('BookScreen');

// ===== ENHANCED SEARCH & GENRE SYSTEM =====

// Enhanced search functionality
function setupSearchHandler() {
    const form = document.getElementById('form');
    const searchInput = document.getElementById('search');
    const searchButton = document.getElementById('search-btn');
    
    if (!form || !searchInput) return;
    
    // Clear any existing event listeners
    form.replaceWith(form.cloneNode(true));
    const newForm = document.getElementById('form');
    const newSearchInput = document.getElementById('search');
    const newSearchButton = document.getElementById('search-btn');
    
    // Form submit handler
    newForm.addEventListener('submit', (e) => {
        e.preventDefault();
        performSearch(newSearchInput.value.trim());
    });
    
    // Real-time search with debouncing
    newSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        // Set new timeout for debouncing (500ms)
        searchTimeout = setTimeout(() => {
            if (query.length >= 2 || query.length === 0) {
                performSearch(query);
            }
        }, 500);
        
        // Show/hide clear button
        updateClearButton(query);
    });
    
    // Clear search functionality
    setupClearSearchButton();
    
    // Search button click handler for mobile
    if (newSearchButton) {
        newSearchButton.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                const searchForm = document.querySelector('.search-form');
                if (searchForm && !searchForm.classList.contains('active')) {
                    e.preventDefault();
                    searchForm.classList.add('active');
                    newSearchInput.focus();
                }
            }
        });
    }
    
    console.log('✅ Enhanced search system initialized');
}

// Perform search with multi-field capability
async function performSearch(query) {
    currentQuery = query;
    currentPage = 1;
    
    // Show loading state
    const main = document.getElementById('main');
    if (main && query.length > 0) {
        main.innerHTML = `
            <div class="loading search-loading">
                <div class="loading-spinner">
                    <i class='bx bx-search-alt bx-spin'></i>
                </div>
                <p>Searching for "${query}"...</p>
            </div>
        `;
    }
    
    try {
        // Try API search first
        await loadDatabaseBooks(query, 1);
        
        // If no results from API, try local filtering as fallback
        if (searchResultsCount === 0 && query.length > 0) {
            await performLocalSearch(query);
        }
        
    } catch (error) {
        console.error('Search error:', error);
        // Fallback to local search
        await performLocalSearch(query);
    }
}

// Local search fallback
async function performLocalSearch(query) {
    console.log('🔍 Performing local search for:', query);
    
    try {
        // Load all books first
        const response = await fetch(`${API_URL}?limit=100&status=approved`);
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.books) {
                // Filter books locally
                const filteredBooks = data.books.filter(book => 
                    matchesSearchQuery(book, query)
                );
                
                searchResultsCount = filteredBooks.length;
                
                // Render results
                const main = document.getElementById('main');
                if (main) {
                    if (filteredBooks.length > 0) {
                        const booksWithStableISBN = filteredBooks.map(book => ({
                            ...book,
                            isbn: getStableISBN(book)
                        }));
                        
                        renderBooks(booksWithStableISBN, 'main');
                    } else {
                        showNoSearchResults(query);
                    }
                }
                
                // Update pagination for local results
                updatePaginationForLocalResults();
            }
        }
    } catch (error) {
        console.error('Local search error:', error);
        showNoSearchResults(query);
    }
}

// Multi-field search matching
function matchesSearchQuery(book, query) {
    if (!query) return true;
    
    const searchTerms = query.toLowerCase().split(' ');
    
    return searchTerms.some(term => 
        (book.title && book.title.toLowerCase().includes(term)) ||
        (book.author && book.author.toLowerCase().includes(term)) ||
        (book.genre && book.genre.toLowerCase().includes(term)) ||
        (book.description && book.description.toLowerCase().includes(term)) ||
        (book.language && book.language.toLowerCase().includes(term)) ||
        (book.publicationYear && book.publicationYear.toString().includes(term))
    );
}

// No search results message
function showNoSearchResults(query) {
    const main = document.getElementById('main');
    if (!main) return;
    
    main.innerHTML = `
        <div class="no-results">
            <div class="no-results-icon">
                <i class='bx bx-search-alt'></i>
            </div>
            <h2>No Books Found</h2>
            <p>No results found for "<strong>${query}</strong>"</p>
            <p>Try different keywords or browse all books:</p>
            <div class="no-results-actions">
                <button class="btn-primary" onclick="clearSearch()">
                    <i class='bx bx-book-open'></i> Show All Books
                </button>
            </div>
        </div>
    `;
    
    searchResultsCount = 0;
}

// Clear search functionality
function clearSearch() {
    const searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.value = '';
    }
    
    currentQuery = '';
    currentPage = 1;
    
    // Update clear button visibility
    updateClearButton('');
    
    // Reload all books
    loadDatabaseBooks('', 1);
    
    // Show notification
    showNotification('Search cleared - showing all books');
}

// Setup clear search button
function setupClearSearchButton() {
    const searchForm = document.querySelector('.search-form');
    if (!searchForm) return;
    
    // Remove existing clear button if any
    const existingClearBtn = searchForm.querySelector('.clear-search-btn');
    if (existingClearBtn) {
        existingClearBtn.remove();
    }
    
    // Create clear button
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'clear-search-btn';
    clearBtn.innerHTML = '<i class="bx bx-x"></i>';
    clearBtn.title = 'Clear search';
    clearBtn.style.display = 'none';
    
    clearBtn.addEventListener('click', () => {
        clearSearch();
    });
    
    // Insert after search input
    const searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.parentNode.insertBefore(clearBtn, searchInput.nextSibling);
    }
    
    // Initial state
    updateClearButton('');
}

// Update clear button visibility
function updateClearButton(query) {
    const clearBtn = document.querySelector('.clear-search-btn');
    if (clearBtn) {
        clearBtn.style.display = query.length > 0 ? 'flex' : 'none';
    }
}

// ===== ENHANCED GENRE SELECTION SYSTEM =====

function initializeGenres() {
    const tagsEl = document.getElementById('tags');
    if (!tagsEl) return;
    
    // Clear existing content
    tagsEl.innerHTML = '';
    
    // Create genre tags (ONLY REMOVED THE "ALL GENRES" BUTTON, KEPT ALL OTHER GENRES)
    genres.forEach(genre => {
        const tag = document.createElement('div');
        tag.classList.add('tag');
        tag.id = `genre-${genre.id}`;
        tag.setAttribute('data-genre-id', genre.id);
        tag.innerHTML = `
            <span class="tag-text">${genre.name}</span>
            <span class="tag-count" style="display: none">0</span>
        `;
        
        tag.addEventListener('click', () => {
            selectGenre(genre.id);
        });
        
        tagsEl.appendChild(tag);
    });
    
    // Select "All" by default
    selectedGenre = ['all'];
    highlightSelectedGenres();
    
    console.log('✅ Enhanced genre system initialized');
}

// Single genre selection
function selectGenre(genreId) {
    // Clear search when genre changes
    clearSearch();
    
    // Single selection - only one genre at a time
    if (genreId === 'all') {
        selectedGenre = ['all'];
    } else {
        selectedGenre = [genreId]; // Only the selected genre
    }
    
    highlightSelectedGenres();
    currentPage = 1;
    
    // Load books with selected genre
    loadDatabaseBooks('');
    
    // Show notification
    if (genreId === 'all') {
        showNotification('Showing all genres');
    } else {
        const genreName = genres.find(g => g.id === genreId)?.name || genreId;
        showNotification(`Showing ${genreName} books`);
    }
}

// Enhanced genre highlighting with your existing color scheme
function highlightSelectedGenres() {
    const tags = document.querySelectorAll('.tag');
    
    tags.forEach(tag => {
        const genreId = tag.getAttribute('data-genre-id');
        tag.classList.remove('highlight');
        tag.style.backgroundColor = '';
        tag.style.color = '';
        tag.style.borderColor = '';
        tag.style.transform = '';
        
        // Remove any existing animation classes
        tag.classList.remove('genre-pulse');
    });
    
    selectedGenre.forEach(id => {
        const tagElement = document.getElementById(`genre-${id}`);
        if (tagElement) {
            tagElement.classList.add('highlight');
            
            // Apply your existing color scheme
            if (id === 'all') {
                tagElement.style.backgroundColor = '#4f46e5'; // Your purple color
                tagElement.style.color = 'white';
                tagElement.style.borderColor = '#f0941b';
            } else {
                tagElement.style.backgroundColor = '#4f46e5'; // Your orange color
                tagElement.style.color = 'white';
                tagElement.style.borderColor = '#f0941b';
            }
            
            // Add subtle animation
            tagElement.style.transform = 'scale(1.05)';
            tagElement.classList.add('genre-pulse');
            
            // Reset transform after animation
            setTimeout(() => {
                tagElement.style.transform = 'scale(1)';
            }, 300);
        }
    });
}

// Show all genres function
function showAllGenres() {
    selectGenre('all');
}

// Update pagination for local search results
function updatePaginationForLocalResults() {
    const paginationEl = document.querySelector('.pagination');
    if (paginationEl) {
        paginationEl.style.display = 'none'; // Hide pagination for local results
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📚 Intelli-Read Enhanced Initializing...');
    console.log('Current Page:', window.location.pathname);
    console.log('Is BookScreen:', isBookScreen);
    
    initializeGenres();
    setupSearchHandler(); // Enhanced search
    initializeCommonFeatures();
    
    if (isBookScreen) {
        console.log('🔍 BookScreen Page Detected');
        initializeBookScreen();
    } else {
        console.log('📖 Books Page Detected');
        initializeBooksPage();
    }
    
    // Add CSS for new elements
    addEnhancedSearchStyles();
});

// ===== BOOKSCREEN PAGE =====
async function initializeBookScreen() {
    console.log('🔄 Starting BookScreen initialization...');
    
    try {
        await initializeUserSession();
        console.log('✅ User session initialized');
        
        await loadRecommendedBooks();
        console.log('✅ Recommended books loaded');
        
        await loadDatabaseBooks('', 1);
        console.log('✅ Database books loaded');
        
    } catch (error) {
        console.error('❌ Error initializing book screen:', error);
        await loadDatabaseBooks('', 1);
    }
}

// ===== BOOKS PAGE =====
function initializeBooksPage() {
    loadDatabaseBooks();
    setupSearchHandler();
}

async function loadDatabaseBooks(query = '', page = 1) {
    const main = document.getElementById('main');
    if (!main) {
        console.error('❌ Main container not found!');
        return;
    }
    
    try {
        if (query) {
            main.innerHTML = '<div class="loading search-loading">📚 Searching books...</div>';
        } else {
            main.innerHTML = '<div class="loading">📚 Loading books from database...</div>';
        }
        
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '30',
            status: 'approved',
            sort: 'createdAt',
            order: 'desc'
        });
        
        if (query) params.append('search', query);
        if (selectedGenre.length > 0 && !selectedGenre.includes('all')) {
            params.append('genres', selectedGenre.join(','));
        }
        
        console.log('🔗 Fetching books from API...');
        const response = await fetch(`${API_URL}?${params}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API Response received:', data);
            
            if (data.success && data.books && data.books.length > 0) {
                totalPages = data.totalPages || Math.ceil(data.totalCount / 20) || 1;
                currentPage = page;
                searchResultsCount = data.books.length;
                
                // Use stable ISBN generation for all books
                const booksWithStableISBN = data.books.map(book => ({
                    ...book,
                    isbn: getStableISBN(book)
                }));
                
                // Sort books to ensure newest at the end
                const sortedBooks = sortBooksByDate(booksWithStableISBN);
                console.log(`🎨 Rendering ${sortedBooks.length} books`);
                console.log('📖 First book data:', sortedBooks[0]);
                renderBooks(sortedBooks, 'main');
                
                updatePagination();
            } else {
                console.log('ℹ️ No books found in response');
                if (query) {
                    showNoSearchResults(query);
                } else {
                    showNoBooksMessage(main);
                }
                searchResultsCount = 0;
                updatePagination();
            }
        } else {
            throw new Error(`API request failed with status: ${response.status}`);
        }
        
    } catch (error) {
        console.error('❌ Error loading database books:', error);
        const main = document.getElementById('main');
        if (main) {
            if (query) {
                showNoSearchResults(query);
            } else {
                main.innerHTML = `
                    <div class="no-results">
                        <h2>⚠️ Connection Error</h2>
                        <p>Unable to load books from database. Please try again later.</p>
                        <p>Error: ${error.message}</p>
                    </div>
                `;
            }
        }
        searchResultsCount = 0;
        updatePagination();
    }
}

// Sort books with newest at the end
function sortBooksByDate(books) {
    return books.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.uploadDate || a.addedDate || 0);
        const dateB = new Date(b.createdAt || b.uploadDate || b.addedDate || 0);
        return dateA - dateB; // Oldest first (new books at end)
    });
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
    
    if (containerId === 'main') {
        container.innerHTML = '';
    }

    if (books.length === 0 && containerId === 'main') {
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
        
        const imageUrl = book.imagePath ? book.imagePath : '/images/default-book.jpg';
        
        bookCard.innerHTML = `
            <img src="${imageUrl}" alt="${book.title}" onerror="this.src='/images/default-book.jpg'">
            <h3>${book.title}</h3>
            <p class="author">${book.author}</p>
            <div class="book-description">
                <p>${book.description || 'No description available'}</p>
            </div>
        `;
        
        bookCard.addEventListener('click', () => showBookDetailsInHTMLModal(book));
        container.appendChild(bookCard);
    });
}

function createBookElement(book) {
    const bookEl = document.createElement('div');
    
    if (isBookScreen) {
        bookEl.classList.add('book', 'book-screen-book');
    } else {
        bookEl.classList.add('book');
    }
    
    bookEl.setAttribute('data-id', book.id);
    bookEl.setAttribute('data-book', JSON.stringify(book));

    const imageUrl = book.imagePath ? book.imagePath : '/images/default-book.jpg';

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
            const bookData = JSON.parse(bookEl.getAttribute('data-book'));
            showBookDetailsInHTMLModal(bookData);
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

// ===== ENHANCED USER DASHBOARD INTEGRATION =====

// Function to update user dashboard data after actions
async function updateUserDashboardData() {
    try {
        // Reload all user data to reflect changes
        await loadUserDashboardData();
        console.log('✅ User dashboard data updated');
    } catch (error) {
        console.error('❌ Error updating user dashboard:', error);
    }
}

// Enhanced function to add book to user dashboard
async function addToUserDashboard(book, listType) {
    try {
        const response = await fetch(`${USER_API_URL}/dashboard/${listType}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                bookId: book.id || book._id,
                bookTitle: book.title,
                bookAuthor: book.author,
                bookGenre: book.genre,
                bookCover: book.imagePath,
                filePath: book.filePath,
                addedAt: new Date().toISOString(),
                status: listType === 'reading_list' ? 'pending' : 'completed'
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log(`✅ Book added to ${listType}:`, result);
            
            // Update dashboard data
            await updateUserDashboardData();
            return true;
        } else {
            throw new Error(`Failed to add book to ${listType}`);
        }
    } catch (error) {
        console.error(`❌ Error adding book to ${listType}:`, error);
        showNotification(`Failed to add book to ${listType.replace('_', ' ')}`, false);
        return false;
    }
}

// Enhanced function to track reading activity
async function trackReadingActivity(bookId, action, duration = null) {
    try {
        const response = await fetch(`${USER_API_URL}/reading-activity`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                bookId: bookId,
                action: action,
                timestamp: new Date().toISOString(),
                page: window.modalCurrentPage || 1,
                duration: duration
            })
        });

        if (response.ok) {
            console.log('✅ Reading activity tracked:', action);
            
            // Update dashboard data
            await updateUserDashboardData();
        }
    } catch (error) {
        console.error('❌ Error tracking reading activity:', error);
    }
}

// Enhanced download tracking
async function trackDownloadActivity(book) {
    try {
        const response = await fetch(`${USER_API_URL}/downloads`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                },
            body: JSON.stringify({
                bookId: book.id || book._id,
                bookTitle: book.title,
                bookAuthor: book.author,
                downloadedAt: new Date().toISOString(),
                filePath: book.filePath,
                fileSize: book.fileSize || 'Unknown'
            })
        });

        if (response.ok) {
            console.log('✅ Download activity tracked');
            
            // Update dashboard data
            await updateUserDashboardData();
        }
    } catch (error) {
        console.error('❌ Error tracking download activity:', error);
    }
}

// ===== HTML MODAL FUNCTION =====
function showBookDetailsInHTMLModal(book) {
    const modal = document.getElementById('bookModal');
    if (!modal) {
        console.error('❌ bookModal not found');
        return;
    }
    
    console.log('📖 Showing ACTUAL book data in modal:', book);
    
    // Store current book for PDF viewer
    window.currentModalBook = book;
    
    // Get stable ISBN (same every time for same book)
    const stableISBN = getStableISBN(book);
    
    // Populate modal with ACTUAL book data from API
    document.getElementById('modalBookTitle').textContent = book.title;
    document.getElementById('modalBookAuthor').textContent = `by ${book.author || 'Unknown Author'}`;
    document.getElementById('modalBookCover').src = book.imagePath || '/images/default-book.jpg';
    document.getElementById('modalBookYear').textContent = book.publicationYear || 'N/A';
    document.getElementById('modalBookGenre').textContent = book.genre || 'General';
    document.getElementById('modalBookISBN').textContent = stableISBN; // Use stable ISBN
    document.getElementById('modalBookLanguage').textContent = book.language || 'English';
    document.getElementById('modalBookDescription').textContent = book.description || 'No description available for this book.';

    // Show/hide buttons based on ACTUAL PDF availability
    const readNowBtn = document.getElementById('readNowBtn');
    const downloadBookBtn = document.getElementById('downloadBookBtn');
    const addToReadListBtn = document.getElementById('addToReadListBtn');

    if (book.filePath) {
        readNowBtn.style.display = 'flex';
        downloadBookBtn.style.display = 'flex';
        
        // Update read button to use ENHANCED PDF viewer
        readNowBtn.onclick = () => {
            if (book.filePath) {
                // Track reading start
                trackReadingActivity(book.id || book._id, 'start_reading');
                openActualPdfViewer(book); // Use enhanced viewer
            } else {
                showNotification('This book is not available for reading yet.', false);
            }
        };
    } else {
        readNowBtn.style.display = 'none';
        downloadBookBtn.style.display = 'none';
    }

    // Update download button with ACTUAL file
    downloadBookBtn.onclick = async () => {
        if (book.filePath) {
            // Add to downloads and track activity
            await addToUserDashboard(book, 'downloads');
            await trackDownloadActivity(book);
            showNotification(`"${book.title}" added to your downloads!`);
            
            // Trigger actual download
            const link = document.createElement('a');
            link.href = book.filePath;
            link.download = `${book.title}.pdf`;
            link.click();
        } else {
            showNotification('Download not available for this book', false);
        }
    };

    // Update add to read list button
    addToReadListBtn.onclick = async () => {
        await addToUserDashboard(book, 'reading_list');
        showNotification(`"${book.title}" added to your reading list!`);
    };

    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ===== ACTUAL PDF VIEWER =====
function openActualPdfViewer(book) {
    if (!book.filePath) {
        showNotification('PDF not available for this book', false);
        return;
    }
    
    const pdfViewer = document.getElementById('pdfViewer');
    const pdfBookTitle = document.getElementById('pdfBookTitle');
    const pdfCoverTitle = document.getElementById('pdfCoverTitle');
    const pdfCoverAuthor = document.getElementById('pdfCoverAuthor');
    const pdfBookCover = document.getElementById('pdfBookCover');
    const realBookPages = document.getElementById('realBookPages');
    const realBookContainer = document.querySelector('.real-book-container');
    
    if (!pdfViewer) {
        console.error('PDF viewer not found');
        return;
    }
    
    // Set book information
    pdfBookTitle.textContent = book.title;
    pdfCoverTitle.textContent = book.title;
    pdfCoverAuthor.textContent = `by ${book.author || 'Unknown Author'}`;
    pdfBookCover.src = book.imagePath || '/images/default-book.jpg';
    pdfBookCover.alt = book.title;
    
    // Show loading state
    realBookPages.innerHTML = `
        <div class="pdf-loading">
            <div class="loading-spinner">
                <i class='bx bx-loader-alt bx-spin'></i>
            </div>
            <h3>Opening "${book.title}"</h3>
            <p>Loading your reading experience...</p>
        </div>
    `;
    
    // Open PDF viewer
    pdfViewer.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Start book opening animation
    setTimeout(() => {
        realBookContainer.classList.add('book-open');
        
        // Load actual PDF after animation
        setTimeout(() => {
            loadRealPdfContent(book, realBookPages);
        }, 1500);
    }, 500);
    
    // Track reading activity
    trackReadingActivity(book.id || book._id, 'start_reading');
}

function loadRealPdfContent(book, container) {
    // Create embedded PDF viewer with real book styling
    container.innerHTML = `
        <div class="book-page active">
            <div class="page-content-real">
                <div class="page-header">
                    <h2>${book.title}</h2>
                    <p class="author">by ${book.author || 'Unknown Author'}</p>
                </div>
                
                <div class="pdf-content-area">
                    <embed 
                        src="${book.filePath}" 
                        type="application/pdf" 
                        width="100%" 
                        height="600px"
                        class="pdf-embed-full"
                    >
                    <div class="pdf-fallback-message">
                        <p><i class='bx bx-info-circle'></i> If PDF doesn't load properly:</p>
                        <p><a href="${book.filePath}" target="_blank" class="pdf-link">
                            <i class='bx bx-link-external'></i> Open PDF in new tab
                        </a></p>
                    </div>
                </div>
                
                <div class="page-footer">
                    <p>Thank you for reading with Intelli-Read</p>
                    <p>Page 1</p>
                </div>
            </div>
        </div>
    `;

    // Add to reading history
    addToUserDashboard(book, 'reading_history');
    
    // Set up page navigation
    setupRealBookNavigation();
}

function setupRealBookNavigation() {
    // Update page indicator
    document.getElementById('pageIndicator').textContent = 'Page 1 of 1';
    
    // Disable prev/next for single page PDF
    document.getElementById('prevPageBtn').disabled = true;
    document.getElementById('nextPageBtn').disabled = true;
    document.getElementById('prevPageNav').style.display = 'none';
    document.getElementById('nextPageNav').style.display = 'none';
}

// Enhanced close function with animation
function closePdfViewerEnhanced() {
    const pdfViewer = document.getElementById('pdfViewer');
    const realBookContainer = document.querySelector('.real-book-container');
    
    if (realBookContainer) {
        realBookContainer.classList.remove('book-open');
        
        setTimeout(() => {
            pdfViewer.classList.remove('active');
            document.body.style.overflow = 'auto';
        }, 1000);
    } else {
        pdfViewer.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Update the global close function
window.closePdfViewer = closePdfViewerEnhanced;

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
            
            // Load user-specific data
            await loadUserDashboardData();
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

// ===== USER DASHBOARD DATA =====
async function loadUserDashboardData() {
    try {
        const response = await fetch(`${USER_API_URL}/dashboard/data`);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ User dashboard data loaded:', data);
            updateUserDashboardUI(data);
        } else if (response.status === 404) {
            console.log('ℹ️ Dashboard endpoint not available, using fallback');
            // Continue without dashboard data
        }
    } catch (error) {
        console.log('ℹ️ Dashboard data unavailable, continuing without it');
        // Continue execution without dashboard data
    }
}

function updateUserDashboardUI(data) {
    // Update user stats if elements exist
    const statsElements = {
        'totalBooksRead': data?.stats?.booksRead || 0,
        'readingListCount': data?.stats?.readingListCount || 0,
        'downloadsCount': data?.stats?.downloadsCount || 0
    };
    
    Object.keys(statsElements).forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = statsElements[elementId];
        }
    });
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

// ===== ENHANCED STYLES =====
function addEnhancedSearchStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Enhanced Search Styles */
        .search-loading {
            text-align: center;
            padding: 40px 20px;
            color: #e2e8f0;
        }
        
        .search-loading .loading-spinner {
            font-size: 48px;
            margin-bottom: 20px;
            color: #4f46e5;
        }
        
        .clear-search-btn {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: #e2e8f0;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-left: 10px;
            flex-shrink: 0;
        }
        
        .clear-search-btn:hover {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
            transform: scale(1.1);
        }
        
        .no-results {
            text-align: center;
            padding: 40px 20px;
            color: #e2e8f0;
        }
        
        .no-results-icon {
            font-size: 64px;
            color: #6b7280;
            margin-bottom: 20px;
        }
        
        .no-results h2 {
            color: #f0941b;
            margin-bottom: 15px;
        }
        
        .no-results-actions {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin: 25px 0;
            flex-wrap: wrap;
        }
        
        /* Enhanced Genre Styles */
        .tag {
            transition: all 0.3s ease;
            cursor: pointer;
            border: 2px solid rgba(255, 255, 255, 0.2);
        }
        
        .tag.highlight {
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }
        
        .genre-pulse {
            animation: genrePulse 0.3s ease-in-out;
        }
        
        @keyframes genrePulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .tag-count {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            padding: 2px 8px;
            font-size: 12px;
            margin-left: 5px;
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
            .no-results-actions {
                flex-direction: column;
                align-items: center;
            }
            
            .no-results-actions button {
                width: 100%;
                max-width: 250px;
            }
            
            .search-form.active {
                position: relative;
            }
            
            .clear-search-btn {
                position: absolute;
                right: 50px;
                top: 50%;
                transform: translateY(-50%);
            }
        }
        
        @media (max-width: 480px) {
            .search-results-info {
                padding: 15px;
            }
            
            .results-header h3 {
                font-size: 18px;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// ===== GLOBAL FUNCTIONS =====
window.readBook = readBook;
window.showBookDetailsInHTMLModal = showBookDetailsInHTMLModal;
window.showNotification = showNotification;
window.openActualPdfViewer = openActualPdfViewer;
window.addToUserDashboard = addToUserDashboard;
window.clearSearch = clearSearch;
window.showAllGenres = showAllGenres;
window.performSearch = performSearch;

console.log('✅ Enhanced BookScript.js with Search & Genre System loaded successfully!');