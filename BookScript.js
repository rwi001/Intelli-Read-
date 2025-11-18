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

// ===== PAGE DETECTION =====
const isBookScreen = window.location.pathname.includes('BookScreen') || 
                    document.title.includes('BookScreen');

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📚 Intelli-Read Initializing...');
    console.log('Current Page:', window.location.pathname);
    console.log('Is BookScreen:', isBookScreen);
    
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
        main.innerHTML = '<div class="loading">📚 Loading books from database...</div>';
        
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
                
                // Sort books to ensure newest at the end
                const sortedBooks = sortBooksByDate(data.books);
                console.log(`🎨 Rendering ${sortedBooks.length} books`);
                console.log('📖 First book data:', sortedBooks[0]);
                renderBooks(sortedBooks, 'main');
                updatePagination();
            } else {
                console.log('ℹ️ No books found in response');
                showNoBooksMessage(main);
                updatePagination();
            }
        } else {
            throw new Error(`API request failed with status: ${response.status}`);
        }
        
    } catch (error) {
        console.error('❌ Error loading database books:', error);
        const main = document.getElementById('main');
        if (main) {
            main.innerHTML = `
                <div class="no-results">
                    <h2>⚠️ Connection Error</h2>
                    <p>Unable to load books from database. Please try again later.</p>
                    <p>Error: ${error.message}</p>
                </div>
            `;
        }
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
    
    // Populate modal with ACTUAL book data from API
    document.getElementById('modalBookTitle').textContent = book.title;
    document.getElementById('modalBookAuthor').textContent = `by ${book.author || 'Unknown Author'}`;
    document.getElementById('modalBookCover').src = book.imagePath || '/images/default-book.jpg';
    document.getElementById('modalBookYear').textContent = book.publicationYear || 'N/A';
    document.getElementById('modalBookGenre').textContent = book.genre || 'General';
    document.getElementById('modalBookISBN').textContent = book.isbn || 'N/A';
    document.getElementById('modalBookPages').textContent = book.pages || 'N/A';
    document.getElementById('modalBookLanguage').textContent = book.language || 'English';
    document.getElementById('modalBookDescription').textContent = book.description || 'No description available for this book.';

    // Show/hide buttons based on ACTUAL PDF availability
    const readNowBtn = document.getElementById('readNowBtn');
    const downloadBookBtn = document.getElementById('downloadBookBtn');
    const addToReadListBtn = document.getElementById('addToReadListBtn');

    if (book.filePath) {
        readNowBtn.style.display = 'flex';
        downloadBookBtn.style.display = 'flex';
        
        // Update read button to use ACTUAL PDF
        readNowBtn.onclick = () => {
            if (book.filePath) {
                // Track reading start
                trackReadingActivity(book.id || book._id, 'start_reading');
                openActualPdfViewer(book);
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
    const bookPages = document.getElementById('bookPagesContainer');
    
    if (!pdfViewer || !pdfBookTitle || !bookPages) {
        console.error('PDF viewer elements not found');
        return;
    }
    
    // Set book title
    pdfBookTitle.textContent = book.title;
    
    // Show loading state
    bookPages.innerHTML = `
        <div class="page loading-page">
            <div class="page-content">
                <div class="loading-spinner">
                    <i class='bx bx-loader-alt bx-spin'></i>
                </div>
                <p>Loading "${book.title}"...</p>
                <p>Opening actual PDF file...</p>
            </div>
        </div>
    `;
    
    // Open PDF viewer
    pdfViewer.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Track reading activity
    trackReadingActivity(book.id || book._id, 'start_reading');
    
    // Set up reading completion tracking when PDF viewer is closed
    const startTime = new Date();
    const originalClosePdf = window.closePdfViewer;
    
    window.closePdfViewer = function() {
        const endTime = new Date();
        const readingDuration = Math.round((endTime - startTime) / 1000); // in seconds
        
        // Track reading completion
        if (readingDuration > 30) { // Only track if read for more than 30 seconds
            trackReadingActivity(book.id || book._id, 'completed_reading', readingDuration);
        }
        
        // Call original close function
        if (typeof originalClosePdf === 'function') {
            originalClosePdf();
        }
        
        // Restore original function
        window.closePdfViewer = originalClosePdf;
    };
    
    // Open actual PDF in embedded viewer
    setTimeout(() => {
        renderActualPdf(book, bookPages);
    }, 1000);
}

function renderActualPdf(book, container) {
    // Create embedded PDF viewer
    container.innerHTML = `
        <div class="pdf-embed-container">
            <embed 
                src="${book.filePath}" 
                type="application/pdf" 
                width="100%" 
                height="100%"
                class="pdf-embed"
            >
            <div class="pdf-fallback">
                <p>If PDF doesn't load, <a href="${book.filePath}" target="_blank" class="pdf-link">click here to open in new tab</a></p>
            </div>
        </div>
    `;

    // Add to reading history
    addToUserDashboard(book, 'reading_history');
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
    
    // Select "All" by default
    selectedGenre = ['all'];
    highlightSelectedGenres();
}

function toggleGenreSelection(genreId) {
    // If "All" is selected, clear other selections
    if (genreId === 'all') {
        selectedGenre = ['all'];
    } else {
        // Remove "all" if another genre is selected
        selectedGenre = selectedGenre.filter(id => id !== 'all');
        
        // Toggle the selected genre
        const index = selectedGenre.indexOf(genreId);
        if (index === -1) {
            selectedGenre.push(genreId);
        } else {
            selectedGenre.splice(index, 1);
        }
        
        // If no genres selected, default to "all"
        if (selectedGenre.length === 0) {
            selectedGenre = ['all'];
        }
    }
    
    highlightSelectedGenres();
    currentPage = 1;
    
    loadDatabaseBooks(currentQuery);
}

function highlightSelectedGenres() {
    const tags = document.querySelectorAll('.tag');
    tags.forEach(tag => {
        tag.classList.remove('highlight');
        tag.style.backgroundColor = '';
        tag.style.color = '';
    });
    
    selectedGenre.forEach(id => {
        const tagElement = document.getElementById(id);
        if (tagElement) {
            tagElement.classList.add('highlight');
            tagElement.style.backgroundColor = '#4f46e5';
            tagElement.style.color = 'white';
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
            
            // Update UI with user-specific data
            updateUserDashboardUI(data);
        }
    } catch (error) {
        console.error('❌ Error loading user dashboard data:', error);
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
// ===== ENHANCED BOOK ACTIONS =====

// Add to Reading List Function
async function addToReadingList(book) {
    try {
        const userResponse = await fetch('/api/auth/status');
        const authData = await userResponse.json();
        
        if (!authData.success || !authData.isLoggedIn) {
            showNotification('Please login to add books to reading list', false);
            return false;
        }

        const response = await fetch('/api/user/reading-list', {
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
                addedAt: new Date().toISOString(),
                status: 'pending'
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Book added to reading list:', result);
            showNotification(`"${book.title}" added to your reading list!`);
            return true;
        } else {
            throw new Error('Failed to add to reading list');
        }
    } catch (error) {
        console.error('❌ Error adding to reading list:', error);
        showNotification('Failed to add book to reading list', false);
        return false;
    }
}

// Download Book Function
async function downloadBook(book) {
    try {
        const userResponse = await fetch('/api/auth/status');
        const authData = await userResponse.json();
        
        if (!authData.success || !authData.isLoggedIn) {
            showNotification('Please login to download books', false);
            return false;
        }

        // Add to downloads in user dashboard
        const downloadResponse = await fetch('/api/user/downloads', {
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
                downloadedAt: new Date().toISOString(),
                format: 'PDF'
            })
        });

        if (downloadResponse.ok) {
            const result = await downloadResponse.json();
            console.log('✅ Book added to downloads:', result);
            
            // Trigger actual file download
            if (book.filePath) {
                const link = document.createElement('a');
                link.href = book.filePath;
                link.download = `${book.title}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showNotification(`"${book.title}" downloaded successfully!`);
            } else {
                showNotification('Book added to downloads, but file not available', false);
            }
            return true;
        } else {
            throw new Error('Failed to add to downloads');
        }
    } catch (error) {
        console.error('❌ Error downloading book:', error);
        showNotification('Failed to download book', false);
        return false;
    }
}

// Read Book Function - Enhanced
function readBookNow(book) {
    if (!book.filePath) {
        showNotification('This book is not available for reading yet.', false);
        return;
    }
    
    // Track reading activity
    trackReadingActivity(book.id || book._id, 'start_reading');
    
    // Open PDF in modal viewer
    openActualPdfViewer(book);
}

// ===== ENHANCED MODAL BUTTON HANDLERS =====

function setupModalButtonHandlers(book) {
    const readNowBtn = document.getElementById('readNowBtn');
    const downloadBookBtn = document.getElementById('downloadBookBtn');
    const addToReadListBtn = document.getElementById('addToReadListBtn');

    // Read Now Button
    if (readNowBtn) {
        readNowBtn.onclick = () => readBookNow(book);
    }

    // Download Button
    if (downloadBookBtn) {
        downloadBookBtn.onclick = async () => {
            await downloadBook(book);
        };
    }

    // Add to Reading List Button
    if (addToReadListBtn) {
        addToReadListBtn.onclick = async () => {
            await addToReadingList(book);
        };
    }
}

// ===== UPDATED HTML MODAL FUNCTION =====

function showBookDetailsInHTMLModal(book) {
    const modal = document.getElementById('bookModal');
    if (!modal) {
        console.error('❌ bookModal not found');
        return;
    }
    
    console.log('📖 Showing ACTUAL book data in modal:', book);
    
    // Store current book for PDF viewer
    window.currentModalBook = book;
    
    // Populate modal with ACTUAL book data from API
    document.getElementById('modalBookTitle').textContent = book.title;
    document.getElementById('modalBookAuthor').textContent = `by ${book.author || 'Unknown Author'}`;
    document.getElementById('modalBookCover').src = book.imagePath || '/images/default-book.jpg';
    document.getElementById('modalBookYear').textContent = book.publicationYear || 'N/A';
    document.getElementById('modalBookGenre').textContent = book.genre || 'General';
    document.getElementById('modalBookISBN').textContent = book.isbn || 'N/A';
    document.getElementById('modalBookPages').textContent = book.pages || 'N/A';
    document.getElementById('modalBookLanguage').textContent = book.language || 'English';
    document.getElementById('modalBookDescription').textContent = book.description || 'No description available for this book.';

    // Show/hide buttons based on ACTUAL PDF availability
    const readNowBtn = document.getElementById('readNowBtn');
    const downloadBookBtn = document.getElementById('downloadBookBtn');
    const addToReadListBtn = document.getElementById('addToReadListBtn');

    if (book.filePath) {
        readNowBtn.style.display = 'flex';
        downloadBookBtn.style.display = 'flex';
        addToReadListBtn.style.display = 'flex';
    } else {
        readNowBtn.style.display = 'none';
        downloadBookBtn.style.display = 'none';
        addToReadListBtn.style.display = 'flex'; // Still allow adding to reading list
    }

    // Setup button handlers
    setupModalButtonHandlers(book);

    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}
// ===== GLOBAL FUNCTIONS =====
window.readBook = readBook;
window.showBookDetailsInHTMLModal = showBookDetailsInHTMLModal;
window.showNotification = showNotification;
window.openActualPdfViewer = openActualPdfViewer;
window.addToUserDashboard = addToUserDashboard;

console.log('✅ Enhanced BookScript.js with User Dashboard Integration loaded successfully!');