const express = require("express");
const app = express();
const path = require("path");
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const nodemailer = require('nodemailer');

// ===== MIDDLEWARE SETUP =====
// Parse JSON bodies first
app.use(express.json());
// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
// Serve static files
app.use(express.static(path.join(__dirname)));

// Session middleware
app.use(session({
  secret: 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true if using HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ===== EMAIL CONFIGURATION =====
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'noreply.intelliread@gmail.com',
    pass: 'qxlriqqdjeiprkod'
  }
});

// Function to send welcome email
async function sendWelcomeEmail(userEmail, userName, role) {
  try {
    const mailOptions = {
      from: 'noreply.intelliread@gmail.com',
      to: userEmail,
      subject: `Welcome to IntelliRead - ${role.charAt(0).toUpperCase() + role.slice(1)} Account Created`,
      html: generateWelcomeEmailHTML(userName, role)
    };
    
    await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent to:', userEmail);
    return true;
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    return false;
  }
}

// Function to generate welcome email HTML
function generateWelcomeEmailHTML(userName, role) {
  const roleSpecificMessage = role === 'publisher' 
    ? 'You can now upload and manage your books on our platform.'
    : 'You can now explore thousands of books and start reading immediately.';
    
  return `
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to IntelliRead</title>
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: linear-gradient(135deg, #fdfcfb, #e2d1c3);
      margin: 0;
      padding: 40px 0;
      color: #333;
    }

    .email-container {
      background-color: #fff;
      max-width: 650px;
      margin: 0 auto;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
      border: 1px solid #f0f0f0;
      transition: all 0.3s ease;
    }

    .header {
      background: linear-gradient(135deg, #ffdd00, #ffb300);
      padding: 25px;
      text-align: center;
    }

    .logo img {
      height: 90px;
      width: auto;
      border-radius: 8px;
    }

    .content {
      padding: 35px;
    }

    .greeting {
      font-size: 18px;
      font-weight: 500;
      color: #333;
      margin-bottom: 15px;
    }

    .highlight {
      color: #ffb300;
      font-weight: 600;
    }

    p {
      line-height: 1.7;
      font-size: 15px;
      color: #555;
      margin-bottom: 16px;
    }

    .message {
      background-color: #fff6cc;
      border-left: 5px solid #ffb300;
      padding: 16px;
      border-radius: 8px;
      font-size: 15px;
      color: #444;
      margin: 25px 0;
    }

    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #ffcc00, #ffb300);
      color: #fff;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 30px;
      font-weight: 600;
      box-shadow: 0 3px 10px rgba(255, 187, 0, 0.3);
      transition: background 0.3s ease, transform 0.2s ease;
    }

    .cta-button:hover {
      background: linear-gradient(135deg, #ffb300, #ff9a00);
      transform: translateY(-2px);
    }

    .signature {
      margin-top: 25px;
      font-style: italic;
      color: #666;
    }

    .footer {
      background-color: #fafafa;
      padding: 25px;
      text-align: center;
      font-size: 13px;
      color: #777;
      border-top: 1px solid #eee;
    }

    .footer b {
      display: block;
      font-size: 14px;
      color: #333;
      margin-bottom: 8px;
    }

    .contact-info {
      margin-top: 10px;
      line-height: 1.8;
    }

    .footer a {
      color: #ffb300;
      text-decoration: none;
      font-weight: 500;
    }

    .footer a:hover {
      text-decoration: underline;
    }

    @media screen and (max-width: 600px) {
      body {
        padding: 20px;
      }
      .content {
        padding: 25px;
      }
      .cta-button {
        padding: 10px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <div class="logo">
        <img src="../images/logo.png" alt="IntelliRead Logo">
      </div>
    </div>

    <!-- Main Content -->
    <div class="content">
      <div class="greeting">
        Hi <span class="highlight">${userName}</span>,
      </div>

      <p>🎉 Congratulations! Your <b>${role.toUpperCase()}</b> account with <b>IntelliRead</b> has been successfully created.</p>

      <div class="message">
        ${roleSpecificMessage}
      </div>

      <p>${role === 'publisher' 
        ? 'You can now upload your books, manage your publications, and reach thousands of readers.' 
        : 'You now have access to thousands of curated books, articles, and intelligent reading tools designed for you.'}</p>

      <div style="text-align: center; margin-top: 30px;">
        <a href="/books" class="cta-button">Get Started 🚀</a>
      </div>

      <div class="signature">
        Thanks & Regards,<br>
        <b>Team IntelliRead</b>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <b>Smart Reading — Smarter Learning 📖✨</b>
      <div class="contact-info">
        📚 Secure AI-Based Online Book Reading Platform<br>
        📧 <a href="mailto:contact@intelliread.com">contact@intelliread.com</a> | 🌍 <a href="https://www.intelliread.com">www.intelliread.com</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// ===== DATABASE SETUP =====
const userSchema = new mongoose.Schema({
  fullName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: { 
    type: String, 
    required: true,
    minlength: [8, 'Password must be at least 8 characters long']
  },
  role: { 
    type: String, 
    enum: ['user', 'publisher'], 
    default: 'user',
    required: true
  },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
  createdAt: { type: Date, default: Date.now }
});

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  status: { type: String, default: 'pending' }, // pending, approved, rejected
  coverImage: { type: String },
  bookFile: { type: String }, // PDF or EPUB file path
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  downloadCount: { type: Number, default: 0 },
  readCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Login history schema for tracking
const loginHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  email: { type: String, required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  loginTime: { type: Date, default: Date.now },
  success: { type: Boolean, default: true }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
const Book = mongoose.models.Book || mongoose.model('Book', bookSchema);
const LoginHistory = mongoose.models.LoginHistory || mongoose.model('LoginHistory', loginHistorySchema);

// ===== CREATE DEFAULT ADMIN ACCOUNT =====
async function createDefaultAdmin() {
  try {
    const existingAdmin = await Admin.findOne({ email: 'admin@intelliread.com' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('teamRv$04', 10);
      const admin = new Admin({
        username: 'admin',
        email: 'admin@intelliread.com',
        password: hashedPassword,
        role: 'superadmin'
      });
      await admin.save();
      console.log('✅ Default admin account created');
      console.log('📧 Email: admin@intelliread.com');
      console.log('🔑 Password: teamRv$04');
    } else {
      console.log('ℹ️  Admin account already exists');
    }
  } catch (error) {
    console.log('⚠️  Admin creation skipped (already exists)');
  }
}

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/intelliread')
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    createDefaultAdmin(); // Create default admin after connection
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    console.log('⚠️  Continuing without MongoDB...');
  });

// ===== AUTHENTICATION MIDDLEWARE =====
const requireAdminAuth = (req, res, next) => {
  if (req.session && req.session.admin) {
    console.log('🔒 Admin authenticated:', req.session.admin.email);
    next();
  } else {
    console.log('❌ Unauthorized access attempt to admin route');
    res.status(401).json({ 
      success: false, 
      message: 'Unauthorized: Please login as admin' 
    });
  }
};

const requireUserAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    console.log('🔒 User authenticated:', req.session.user.email);
    next();
  } else {
    console.log('❌ Unauthorized access attempt to user route');
    res.status(401).json({ 
      success: false, 
      message: 'Unauthorized: Please login first' 
    });
  }
};

const requirePublisherAuth = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'publisher') {
    console.log('🔒 Publisher authenticated:', req.session.user.email);
    next();
  } else {
    console.log('❌ Unauthorized access attempt to publisher route');
    res.status(403).json({ 
      success: false, 
      message: 'Forbidden: Publisher access required' 
    });
  }
};

// ===== API ROUTES =====

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running properly',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to check users
app.get("/api/debug/users", async (req, res) => {
  try {
    const users = await User.find().select('email role fullName createdAt');
    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Create test user endpoint
app.post("/api/create-test-user", async (req, res) => {
  try {
    const testUser = new User({
      fullName: 'Test User',
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10),
      role: 'user'
    });
    
    await testUser.save();
    
    res.json({
      success: true,
      message: 'Test user created',
      user: {
        email: 'test@example.com',
        password: 'password123'
      }
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// ===== ADMIN ROUTES =====

// Admin Login
app.post("/api/admin/login", async (req, res) => {
  console.log('🔐 Admin login attempt:', req.body.email);
  
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ 
        success: false,
        message: 'Database connection failed. Please try again later.' 
      });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      console.log('❌ Admin not found:', email);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid admin credentials' 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      console.log('❌ Invalid password for admin:', email);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid admin credentials' 
      });
    }

    // Create admin session
    req.session.admin = {
      id: admin._id,
      username: admin.username,
      email: admin.email,
      role: admin.role
    };

    console.log('✅ Admin login successful:', email);

    res.json({ 
      success: true,
      message: 'Admin login successful',
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('❌ Admin login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

// Admin Logout
app.post("/api/admin/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('❌ Logout error:', err);
      return res.status(500).json({ 
        success: false,
        message: 'Logout failed' 
      });
    }
    console.log('✅ Admin logged out successfully');
    res.json({ 
      success: true,
      message: 'Logged out successfully' 
    });
  });
});

// Get Dashboard Summary
app.get("/api/admin/summary", requireAdminAuth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ 
        success: false,
        message: 'Database connection failed' 
      });
    }

    const totalUsers = await User.countDocuments();
    const totalPublishers = await User.countDocuments({ role: 'publisher' });
    const totalBooks = await Book.countDocuments();
    const pendingBooks = await Book.countDocuments({ status: 'pending' });
    const approvedBooks = await Book.countDocuments({ status: 'approved' });
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      totalUsers,
      totalPublishers,
      totalBooks,
      pendingBooks,
      approvedBooks,
      activeUsers
    });

  } catch (error) {
    console.error('❌ Dashboard summary error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching dashboard data' 
    });
  }
});

// Get All Users
app.get("/api/admin/users", requireAdminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const role = req.query.role || '';

    let query = {};
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
      totalUsers
    });

  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching users' 
    });
  }
});

// Delete User
app.delete("/api/admin/users/:id", requireAdminAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user's books first
    await Book.deleteMany({ uploadedBy: userId });
    
    // Delete user
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting user' 
    });
  }
});

// Get All Books
app.get("/api/admin/books", requireAdminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status || '';

    let query = {};
    if (status) {
      query.status = status;
    }

    const books = await Book.find(query)
      .populate('uploadedBy', 'fullName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalBooks = await Book.countDocuments(query);

    res.json({
      success: true,
      books,
      totalPages: Math.ceil(totalBooks / limit),
      currentPage: page,
      totalBooks
    });

  } catch (error) {
    console.error('❌ Get books error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching books' 
    });
  }
});

// Update Book Status
app.put("/api/admin/books/:id", requireAdminAuth, async (req, res) => {
  try {
    const bookId = req.params.id;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const book = await Book.findByIdAndUpdate(
      bookId,
      { status },
      { new: true }
    ).populate('uploadedBy', 'fullName email role');

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.json({
      success: true,
      message: `Book ${status} successfully`,
      book
    });

  } catch (error) {
    console.error('❌ Update book error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating book' 
    });
  }
});

// Delete Book
app.delete("/api/admin/books/:id", requireAdminAuth, async (req, res) => {
  try {
    const bookId = req.params.id;
    
    const book = await Book.findByIdAndDelete(bookId);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.json({
      success: true,
      message: 'Book deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete book error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting book' 
    });
  }
});

// ===== USER ROUTES =====

// User Signup endpoint with enhanced debugging
app.post("/api/signup", async (req, res) => {
  console.log('📨 Signup request received:', req.body);
  
  try {
    const { fullName, email, password, role } = req.body;

    // Validate required fields
    if (!fullName || !email || !password || !role) {
      console.log('❌ Missing fields:', { fullName, email, password: '***', role });
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required' 
      });
    }

    // Validate role
    if (!['user', 'publisher'].includes(role)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid role selected' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Please enter a valid email address' 
      });
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.log('❌ MongoDB not connected');
      return res.status(500).json({ 
        success: false,
        message: 'Database connection failed. Please try again later.' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('✅ Password hashed successfully');

    // Create new user
    const newUser = new User({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role
    });

    // Save to database
    await newUser.save();
    console.log('✅ User saved to database:', newUser.email, 'Role:', newUser.role);

    // Create user session
    req.session.user = {
      id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role
    };

    // Send welcome email
    sendWelcomeEmail(newUser.email, newUser.fullName, newUser.role);

    res.status(201).json({ 
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('❌ Signup error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        message: Object.values(error.errors).map(err => err.message).join(', ')
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Internal server error. Please try again.' 
    });
  }
});

// User Login endpoint - Fixed without role validation
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt for email:', email);

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Please enter a valid email address' 
      });
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ Database connection failed during login');
      return res.status(500).json({ 
        success: false,
        message: 'Database connection failed. Please try again later.' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Log failed login attempt
      await LoginHistory.create({
        email: normalizedEmail,
        success: false,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      console.log('❌ User not found:', normalizedEmail);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    console.log('✅ User found:', user.email, 'Role:', user.role);

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      // Log failed login attempt
      await LoginHistory.create({
        userId: user._id,
        email: user.email,
        success: false,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      console.log('❌ Invalid password for user:', user.email);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    console.log('✅ Password verified for user:', user.email);

    // Update user's last login
    user.lastLogin = new Date();
    await user.save();

    // Log successful login
    await LoginHistory.create({
      userId: user._id,
      email: user.email,
      success: true,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Create user session
    req.session.user = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };

    console.log('✅ Login successful for:', user.email, 'Role:', user.role);

    res.json({ 
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    
    if (error.name === 'MongoNetworkError') {
      return res.status(500).json({ 
        success: false,
        message: 'Database connection error. Please try again.' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Internal server error. Please try again.' 
    });
  }
});

// User Logout
app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('❌ Logout error:', err);
      return res.status(500).json({ 
        success: false,
        message: 'Logout failed' 
      });
    }
    console.log('✅ User logged out successfully');
    res.json({ 
      success: true,
      message: 'Logged out successfully' 
    });
  });
});

// Get Current User
app.get("/api/user/me", requireUserAuth, (req, res) => {
  res.json({
    success: true,
    user: req.session.user
  });
});

// Validate user role
app.post("/api/validate-role", async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email and role are required'
      });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== role) {
      return res.status(400).json({
        success: false,
        message: `This account is registered as ${user.role.toUpperCase()}, not ${role.toUpperCase()}. Please select the correct role.`,
        actualRole: user.role
      });
    }

    res.json({
      success: true,
      message: 'Role validation successful',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Role validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating user role'
    });
  }
});

// Get user profile
app.get("/api/user/profile", requireUserAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching user profile' 
    });
  }
});

// Check auth status
app.get("/api/auth/status", (req, res) => {
  if (req.session.user) {
    res.json({
      success: true,
      isLoggedIn: true,
      user: req.session.user
    });
  } else if (req.session.admin) {
    res.json({
      success: true,
      isLoggedIn: true,
      user: req.session.admin,
      isAdmin: true
    });
  } else {
    res.json({
      success: true,
      isLoggedIn: false,
      user: null
    });
  }
});

// ===== BOOK ROUTES (PUBLIC & USER) =====

// Get All Approved Books (Public)
app.get("/api/books", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const category = req.query.category || '';
    const search = req.query.search || '';

    let query = { status: 'approved' };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const books = await Book.find(query)
      .populate('uploadedBy', 'fullName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalBooks = await Book.countDocuments(query);

    res.json({
      success: true,
      books,
      totalPages: Math.ceil(totalBooks / limit),
      currentPage: page,
      totalBooks
    });

  } catch (error) {
    console.error('❌ Get books error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching books' 
    });
  }
});

// Get Book by ID (Public)
app.get("/api/books/:id", async (req, res) => {
  try {
    const bookId = req.params.id;

    const book = await Book.findById(bookId)
      .populate('uploadedBy', 'fullName email role');

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Increment read count
    book.readCount += 1;
    await book.save();

    res.json({
      success: true,
      book
    });

  } catch (error) {
    console.error('❌ Get book error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching book' 
    });
  }
});

// Download Book (User only)
app.get("/api/books/:id/download", requireUserAuth, async (req, res) => {
  try {
    const bookId = req.params.id;

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    if (book.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'This book is not available for download'
      });
    }

    // Increment download count
    book.downloadCount += 1;
    await book.save();

    // For now, return the file path. In production, you'd serve the file
    res.json({
      success: true,
      message: 'Download started',
      downloadUrl: `/books/files/${book.bookFile}`,
      book: {
        title: book.title,
        author: book.author
      }
    });

  } catch (error) {
    console.error('❌ Download book error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error downloading book' 
    });
  }
});

// ===== PUBLISHER ROUTES =====

// Get Publisher's Books
app.get("/api/publisher/books", requirePublisherAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status || '';

    let query = { uploadedBy: req.session.user.id };
    if (status) {
      query.status = status;
    }

    const books = await Book.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalBooks = await Book.countDocuments(query);

    // Get stats for publisher dashboard
    const pendingCount = await Book.countDocuments({ 
      uploadedBy: req.session.user.id, 
      status: 'pending' 
    });
    const approvedCount = await Book.countDocuments({ 
      uploadedBy: req.session.user.id, 
      status: 'approved' 
    });
    const totalDownloads = await Book.aggregate([
      { $match: { uploadedBy: req.session.user.id } },
      { $group: { _id: null, total: { $sum: '$downloadCount' } } }
    ]);

    res.json({
      success: true,
      books,
      totalPages: Math.ceil(totalBooks / limit),
      currentPage: page,
      totalBooks,
      stats: {
        pending: pendingCount,
        approved: approvedCount,
        totalDownloads: totalDownloads[0]?.total || 0
      }
    });

  } catch (error) {
    console.error('❌ Get publisher books error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching your books' 
    });
  }
});

// Add New Book (Publisher only)
app.post("/api/publisher/books", requirePublisherAuth, async (req, res) => {
  try {
    const { title, author, description, category, coverImage, bookFile } = req.body;

    if (!title || !author) {
      return res.status(400).json({
        success: false,
        message: 'Title and author are required'
      });
    }

    const newBook = new Book({
      title,
      author,
      description,
      category,
      coverImage,
      bookFile,
      uploadedBy: req.session.user.id,
      status: 'pending' // Books need admin approval
    });

    await newBook.save();

    console.log('✅ New book added by publisher:', req.session.user.email);

    res.status(201).json({
      success: true,
      message: 'Book submitted successfully. Waiting for admin approval.',
      book: newBook
    });

  } catch (error) {
    console.error('❌ Add book error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error adding book' 
    });
  }
});

// Update Book (Publisher only)
app.put("/api/publisher/books/:id", requirePublisherAuth, async (req, res) => {
  try {
    const bookId = req.params.id;
    const { title, author, description, category, coverImage, bookFile } = req.body;

    // Check if book exists and belongs to the publisher
    const book = await Book.findOne({ _id: bookId, uploadedBy: req.session.user.id });
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found or you do not have permission to edit it'
      });
    }

    // Update book fields
    if (title) book.title = title;
    if (author) book.author = author;
    if (description) book.description = description;
    if (category) book.category = category;
    if (coverImage) book.coverImage = coverImage;
    if (bookFile) book.bookFile = bookFile;
    
    // Reset status to pending if significant changes were made
    if (title || author) {
      book.status = 'pending';
    }

    await book.save();

    res.json({
      success: true,
      message: 'Book updated successfully',
      book
    });

  } catch (error) {
    console.error('❌ Update book error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating book' 
    });
  }
});

// Delete Book (Publisher only)
app.delete("/api/publisher/books/:id", requirePublisherAuth, async (req, res) => {
  try {
    const bookId = req.params.id;

    // Check if book exists and belongs to the publisher
    const book = await Book.findOne({ _id: bookId, uploadedBy: req.session.user.id });
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found or you do not have permission to delete it'
      });
    }

    await Book.findByIdAndDelete(bookId);

    res.json({
      success: true,
      message: 'Book deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete book error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting book' 
    });
  }
});

// Get Publisher Stats
app.get("/api/publisher/stats", requirePublisherAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;

    const totalBooks = await Book.countDocuments({ uploadedBy: userId });
    const pendingBooks = await Book.countDocuments({ 
      uploadedBy: userId, 
      status: 'pending' 
    });
    const approvedBooks = await Book.countDocuments({ 
      uploadedBy: userId, 
      status: 'approved' 
    });
    
    const totalDownloads = await Book.aggregate([
      { $match: { uploadedBy: userId } },
      { $group: { _id: null, total: { $sum: '$downloadCount' } } }
    ]);
    
    const totalReads = await Book.aggregate([
      { $match: { uploadedBy: userId } },
      { $group: { _id: null, total: { $sum: '$readCount' } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalBooks,
        pendingBooks,
        approvedBooks,
        totalDownloads: totalDownloads[0]?.total || 0,
        totalReads: totalReads[0]?.total || 0
      }
    });

  } catch (error) {
    console.error('❌ Get publisher stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching publisher stats' 
    });
  }
});

// ===== HTML ROUTES =====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Home.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "Login.html"));
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "SignUp.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "Admin.html"));
});

app.get("/books", (req, res) => {
  res.sendFile(path.join(__dirname, "Books.html"));
});

app.get("/forgotpassword", (req, res) => {
  res.sendFile(path.join(__dirname, "ForgotPass.html"));
});

// Publisher Dashboard
app.get("/publisher-dashboard", requirePublisherAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard", "publisher-dashboard.html"));
});

// User Dashboard
app.get("/user-dashboard", requireUserAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard", "user-dashboard.html"));
});

// Admin Routes - Protected
app.get("/admin-dashboard", requireAdminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard", "admin-dashboard.html"));
});

// ===== ERROR HANDLING =====
// Handle undefined routes
app.use((req, res) => {
  console.log(`❌ Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ 
    success: false,
    message: `Route not found: ${req.method} ${req.url}`
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('🚨 Server error:', error);
  res.status(500).json({ 
    success: false,
    message: 'Internal server error'
  });
});

// ===== START SERVER =====
const PORT = 3000;
app.listen(PORT, () => {
  console.log("=".repeat(60));
  console.log("🚀 SERVER STARTED SUCCESSFULLY");
  console.log("=".repeat(60));
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`📍 Network: http://127.0.0.1:${PORT}`);
  console.log("📧 Email system: Ready");
  console.log("👥 Role-based access: Enabled");
  console.log("📚 User roles: User (Read/Download), Publisher (Manage Books)");
  console.log("🔐 Authentication: Session-based with enhanced debugging");
  console.log("📊 Analytics: Login tracking, download/read counts");
  console.log("🐛 Debug endpoints: /api/debug/users, /api/create-test-user");
});