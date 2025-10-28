const apiUrl = "http://localhost:3000/api";

// Current state
let currentPage = {
    users: 1,
    books: 1
};
const itemsPerPage = 10;

// Initialize dashboard
document.addEventListener("DOMContentLoaded", function() {
    showSection('dashboard');
    loadDashboard();
    
    // Close modal when clicking X
    document.querySelector('.close').addEventListener('click', closeModal);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('userModal');
        if (event.target === modal) {
            closeModal();
        }
    });
});

// Show section with smooth transitions
function showSection(id) {
    // Update menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`.menu-item:nth-child(${getMenuIndex(id)})`).classList.add('active');
    
    // Update sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(id).classList.add('active');
    
    // Load section data
    switch(id) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'users':
            loadUsers();
            break;
        case 'books':
            loadBooks();
            break;
        case 'analytics':
            loadAnalytics();
            break;
    }
}

function getMenuIndex(section) {
    const sections = ['dashboard', 'users', 'books', 'analytics', 'settings'];
    return sections.indexOf(section) + 1;
}

// Load Dashboard Data
async function loadDashboard() {
    try {
        // Simulate API calls with mock data
        const dashboardData = {
            totalUsers: 1247,
            totalBooks: 856,
            pendingBooks: 23,
            activeUsers: 89
        };
        
        // Update stats
        document.getElementById('totalUsers').textContent = dashboardData.totalUsers.toLocaleString();
        document.getElementById('totalBooks').textContent = dashboardData.totalBooks.toLocaleString();
        document.getElementById('pendingBooks').textContent = dashboardData.pendingBooks;
        document.getElementById('activeUsers').textContent = dashboardData.activeUsers;
        
        // Load recent activity
        loadRecentActivity();
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showNotification('Error loading dashboard data', 'error');
    }
}

// Load Recent Activity
function loadRecentActivity() {
    const activities = [
        { type: 'user', message: 'New user registered: John Doe', time: '2 minutes ago', icon: 'user' },
        { type: 'book', message: 'New book added: "The Great Gatsby"', time: '5 minutes ago', icon: 'book' },
        { type: 'system', message: 'System backup completed', time: '1 hour ago', icon: 'system' },
        { type: 'user', message: 'User Sarah Johnson updated profile', time: '2 hours ago', icon: 'user' },
        { type: 'book', message: 'Book "1984" approved for publishing', time: '3 hours ago', icon: 'book' }
    ];
    
    const activityList = document.getElementById('recentActivity');
    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.icon}">
                <i class='bx bx-${activity.icon === 'system' ? 'cog' : activity.icon}'></i>
            </div>
            <div class="activity-content">
                <p>${activity.message}</p>
                <small>${activity.time}</small>
            </div>
        </div>
    `).join('');
}

// Load Users with pagination
async function loadUsers(page = 1) {
    try {
        // Mock user data
        const mockUsers = Array.from({ length: 45 }, (_, i) => ({
            _id: `user${i + 1}`,
            name: `User ${i + 1}`,
            email: `user${i + 1}@example.com`,
            joined: new Date(Date.now() - Math.random() * 10000000000).toLocaleDateString(),
            status: Math.random() > 0.2 ? 'active' : 'inactive'
        }));
        
        const startIndex = (page - 1) * itemsPerPage;
        const paginatedUsers = mockUsers.slice(startIndex, startIndex + itemsPerPage);
        
        const tbody = document.getElementById('userTableBody');
        tbody.innerHTML = paginatedUsers.map(user => `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.joined}</td>
                <td><span class="status-badge status-${user.status}">${user.status}</span></td>
                <td>
                    <button class="action-btn btn-view" onclick="viewUser('${user._id}')" title="View Details">
                        <i class='bx bx-show'></i>
                    </button>
                    <button class="action-btn btn-edit" onclick="editUser('${user._id}')" title="Edit User">
                        <i class='bx bx-edit'></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="deleteUser('${user._id}')" title="Delete User">
                        <i class='bx bx-trash'></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        // Update pagination
        updatePagination('userPagination', page, Math.ceil(mockUsers.length / itemsPerPage), 'users');
        
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Error loading users', 'error');
    }
}

// Load Books with pagination and filtering
async function loadBooks(page = 1, status = '') {
    try {
        // Mock book data
        const mockBooks = Array.from({ length: 67 }, (_, i) => {
            const statuses = ['pending', 'approved', 'rejected'];
            const categories = ['Fiction', 'Science', 'Technology', 'History', 'Biography'];
            return {
                _id: `book${i + 1}`,
                title: `Book Title ${i + 1}`,
                author: `Author ${i + 1}`,
                category: categories[Math.floor(Math.random() * categories.length)],
                status: statuses[Math.floor(Math.random() * statuses.length)],
                dateAdded: new Date(Date.now() - Math.random() * 10000000000).toLocaleDateString(),
                cover: `https://picsum.photos/60/80?random=${i + 1}`
            };
        });
        
        let filteredBooks = mockBooks;
        if (status) {
            filteredBooks = mockBooks.filter(book => book.status === status);
        }
        
        const startIndex = (page - 1) * itemsPerPage;
        const paginatedBooks = filteredBooks.slice(startIndex, startIndex + itemsPerPage);
        
        const tbody = document.getElementById('bookTableBody');
        tbody.innerHTML = paginatedBooks.map(book => `
            <tr>
                <td><img src="${book.cover}" alt="Cover" style="width: 40px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td>${book.category}</td>
                <td><span class="status-badge status-${book.status}">${book.status}</span></td>
                <td>${book.dateAdded}</td>
                <td>
                    ${book.status === 'pending' ? `
                        <button class="action-btn btn-approve" onclick="updateBookStatus('${book._id}', 'approved')" title="Approve">
                            <i class='bx bx-check'></i>
                        </button>
                        <button class="action-btn btn-reject" onclick="updateBookStatus('${book._id}', 'rejected')" title="Reject">
                            <i class='bx bx-x'></i>
                        </button>
                    ` : `
                        <button class="action-btn btn-view" onclick="viewBook('${book._id}')" title="View">
                            <i class='bx bx-show'></i>
                        </button>
                        <button class="action-btn btn-edit" onclick="editBook('${book._id}')" title="Edit">
                            <i class='bx bx-edit'></i>
                        </button>
                    `}
                    <button class="action-btn btn-delete" onclick="deleteBook('${book._id}')" title="Delete">
                        <i class='bx bx-trash'></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        // Update pagination
        updatePagination('bookPagination', page, Math.ceil(filteredBooks.length / itemsPerPage), 'books');
        
    } catch (error) {
        console.error('Error loading books:', error);
        showNotification('Error loading books', 'error');
    }
}

// Pagination
function updatePagination(containerId, currentPage, totalPages, type) {
    const container = document.getElementById(containerId);
    let paginationHTML = '';
    
    if (currentPage > 1) {
        paginationHTML += `<button onclick="changePage('${type}', ${currentPage - 1})">Previous</button>`;
    }
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="active">${i}</button>`;
        } else if (i <= 5 || i > totalPages - 2 || Math.abs(i - currentPage) <= 2) {
            paginationHTML += `<button onclick="changePage('${type}', ${i})">${i}</button>`;
        } else if (i === 6 && currentPage < 4) {
            paginationHTML += `<span>...</span>`;
        } else if (i === totalPages - 1 && currentPage > totalPages - 3) {
            paginationHTML += `<span>...</span>`;
        }
    }
    
    if (currentPage < totalPages) {
        paginationHTML += `<button onclick="changePage('${type}', ${currentPage + 1})">Next</button>`;
    }
    
    container.innerHTML = paginationHTML;
}

function changePage(type, page) {
    currentPage[type] = page;
    if (type === 'users') {
        loadUsers(page);
    } else if (type === 'books') {
        const statusFilter = document.getElementById('statusFilter').value;
        loadBooks(page, statusFilter);
    }
}

// Search and Filter functions
function searchUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    // Implement search logic here
    loadUsers(1); // Reload with search
}

function searchBooks() {
    const searchTerm = document.getElementById('bookSearch').value.toLowerCase();
    // Implement search logic here
    loadBooks(1);
}

function filterBooks() {
    const status = document.getElementById('statusFilter').value;
    loadBooks(1, status);
}

// User Actions
function viewUser(userId) {
    // Mock user details
    const userDetails = `
        <div class="user-details">
            <h3>User Details</h3>
            <p><strong>ID:</strong> ${userId}</p>
            <p><strong>Name:</strong> User ${userId.replace('user', '')}</p>
            <p><strong>Email:</strong> ${userId}@example.com</p>
            <p><strong>Status:</strong> Active</p>
            <p><strong>Joined:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
    `;
    document.getElementById('userDetails').innerHTML = userDetails;
    document.getElementById('userModal').style.display = 'block';
}

function editUser(userId) {
    showNotification(`Editing user: ${userId}`, 'info');
}

async function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            showNotification('User deleted successfully', 'success');
            loadUsers(currentPage.users);
        } catch (error) {
            showNotification('Error deleting user', 'error');
        }
    }
}

// Book Actions
function viewBook(bookId) {
    showNotification(`Viewing book: ${bookId}`, 'info');
}

function editBook(bookId) {
    showNotification(`Editing book: ${bookId}`, 'info');
}

async function updateBookStatus(bookId, status) {
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        showNotification(`Book ${status} successfully`, 'success');
        loadBooks(currentPage.books);
    } catch (error) {
        showNotification('Error updating book status', 'error');
    }
}

async function deleteBook(bookId) {
    if (confirm('Are you sure you want to delete this book?')) {
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            showNotification('Book deleted successfully', 'success');
            loadBooks(currentPage.books);
        } catch (error) {
            showNotification('Error deleting book', 'error');
        }
    }
}

// Analytics
function loadAnalytics() {
    // Placeholder for analytics charts
    console.log('Loading analytics data...');
}

// Export functions
function exportUsers() {
    showNotification('Exporting users data...', 'info');
    // Implement export logic
}

function exportBooks() {
    showNotification('Exporting books data...', 'info');
    // Implement export logic
}

// Modal functions
function closeModal() {
    document.getElementById('userModal').style.display = 'none';
}

// Notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 6px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 3000;
        display: flex;
        align-items: center;
        gap: 1rem;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        showNotification('Logging out...', 'info');
        setTimeout(() => {
            window.location.href = '/login';
        }, 1000);
    }
}

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .notification button {
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0;
    }
`;
document.head.appendChild(notificationStyles);