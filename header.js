// header.js - Common header functionality
function initializeHeader() {
  // Check if user is logged in
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  
  const header = document.querySelector('header');
  if (!header) return;
  
  // Create user info section
  const userSection = document.createElement('div');
  userSection.className = 'user-section';
  userSection.style.cssText = `
    display: flex;
    align-items: center;
    gap: 15px;
    margin-left: auto;
  `;
  
  if (isLoggedIn && userData.fullName) {
    // User is logged in - show welcome message and logout
    userSection.innerHTML = `
      <span style="color: #333; font-weight: 500;">Welcome, ${userData.fullName}</span>
      <button class="btn btn-logout" style="
        background: #ff4757;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 5px;
        cursor: pointer;
        font-family: 'Chakra Petch', sans-serif;
        font-weight: 500;
      ">Logout</button>
    `;
    
    // Add logout functionality
    const logoutBtn = userSection.querySelector('.btn-logout');
    logoutBtn.addEventListener('click', handleLogout);
  } else {
    // User is not logged in - show login button
    userSection.innerHTML = `
      <button class="btn btn-loginoutline" onclick="window.location.href='/login'" style="
        background: transparent;
        color: #333;
        border: 2px solid #333;
        padding: 8px 16px;
        border-radius: 5px;
        cursor: pointer;
        font-family: 'Chakra Petch', sans-serif;
        font-weight: 500;
      ">
        Login
      </button>
    `;
  }
  
  // Add user section to header
  const navButtons = header.querySelector('.nav-buttons');
  if (navButtons) {
    navButtons.appendChild(userSection);
  } else {
    header.appendChild(userSection);
  }
}

function handleLogout() {
  // Clear localStorage
  localStorage.removeItem('user');
  localStorage.removeItem('isLoggedIn');
  
  // Redirect to home page
  window.location.href = '/';
}

// Initialize header when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeHeader);