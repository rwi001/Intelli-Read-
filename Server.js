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

// Function to send publisher approval pending email
async function sendPublisherApprovalEmail(userEmail, userName) {
  try {
    const mailOptions = {
      from: 'noreply.intelliread@gmail.com',
      to: userEmail,
      subject: 'Publisher Account Under Review - IntelliRead',
      html: generatePublisherApprovalEmailHTML(userName)
    };
    
    await transporter.sendMail(mailOptions);
    console.log('✅ Publisher approval email sent to:', userEmail);
    return true;
  } catch (error) {
    console.error('❌ Failed to send publisher approval email:', error);
    return false;
  }
}

// Function to generate publisher approval email HTML
function generatePublisherApprovalEmailHTML(userName) {
  return `
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Publisher Account Under Review - IntelliRead</title>
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
    }
    .header {
      background: linear-gradient(135deg, #ff9800, #f57c00);
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
      color: #ff9800;
      font-weight: 600;
    }
    p {
      line-height: 1.7;
      font-size: 15px;
      color: #555;
      margin-bottom: 16px;
    }
    .message {
      background-color: #fff3e0;
      border-left: 5px solid #ff9800;
      padding: 16px;
      border-radius: 8px;
      font-size: 15px;
      color: #444;
      margin: 25px 0;
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
      color: #ff9800;
      text-decoration: none;
      font-weight: 500;
    }
    .footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo">
        <img src="../images/logo.png" alt="IntelliRead Logo">
      </div>
    </div>
    <div class="content">
      <div class="greeting">
        Hi <span class="highlight">${userName}</span>,
      </div>
      <p>Thank you for registering as a <b>PUBLISHER</b> with <b>IntelliRead</b>!</p>
      <div class="message">
        <strong>Your account is currently under review.</strong><br>
        Our admin team will review your publisher application shortly. 
        You will receive another email once your account has been approved.
        This process typically takes 24-48 hours.
      </div>
      <p>Once approved, you'll be able to:</p>
      <ul>
        <li>Upload and manage your books</li>
        <li>Track downloads and read statistics</li>
        <li>Reach thousands of readers on our platform</li>
      </ul>
      <div class="signature">
        Thanks & Regards,<br>
        <b>Team IntelliRead</b>
      </div>
    </div>
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

// Function to send publisher approval result email
async function sendPublisherApprovalResultEmail(userEmail, userName, approved) {
  try {
    const mailOptions = {
      from: 'noreply.intelliread@gmail.com',
      to: userEmail,
      subject: approved ? 
        'Publisher Account Approved - IntelliRead' : 
        'Publisher Application Update - IntelliRead',
      html: generatePublisherApprovalResultEmailHTML(userName, approved)
    };
    
    await transporter.sendMail(mailOptions);
    console.log('✅ Publisher approval result email sent to:', userEmail);
    return true;
  } catch (error) {
    console.error('❌ Failed to send publisher approval result email:', error);
    return false;
  }
}

// Function to generate publisher approval result email HTML
function generatePublisherApprovalResultEmailHTML(userName, approved) {
  if (approved) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Publisher Account Approved - IntelliRead</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: linear-gradient(135deg, #fdfcfb, #e2d1c3); margin: 0; padding: 40px 0; color: #333; }
        .email-container { background-color: #fff; max-width: 650px; margin: 0 auto; border-radius: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); overflow: hidden; border: 1px solid #f0f0f0; }
        .header { background: linear-gradient(135deg, #4caf50, #45a049); padding: 25px; text-align: center; }
        .logo img { height: 90px; width: auto; border-radius: 8px; }
        .content { padding: 35px; }
        .greeting { font-size: 18px; font-weight: 500; color: #333; margin-bottom: 15px; }
        .highlight { color: #4caf50; font-weight: 600; }
        p { line-height: 1.7; font-size: 15px; color: #555; margin-bottom: 16px; }
        .message { background-color: #e8f5e8; border-left: 5px solid #4caf50; padding: 16px; border-radius: 8px; font-size: 15px; color: #444; margin: 25px 0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #4caf50, #45a049); color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 30px; font-weight: 600; box-shadow: 0 3px 10px rgba(76, 175, 80, 0.3); transition: background 0.3s ease, transform 0.2s ease; }
        .cta-button:hover { background: linear-gradient(135deg, #45a049, #3d8b40); transform: translateY(-2px); }
        .signature { margin-top: 25px; font-style: italic; color: #666; }
        .footer { background-color: #fafafa; padding: 25px; text-align: center; font-size: 13px; color: #777; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="logo">
            <img src="../images/logo.png" alt="IntelliRead Logo">
          </div>
        </div>
        <div class="content">
          <div class="greeting">Hi <span class="highlight">${userName}</span>,</div>
          <p>🎉 Great news! Your <b>PUBLISHER</b> account has been <b>APPROVED</b>!</p>
          <div class="message">
            <strong>Welcome to the IntelliRead Publisher Community!</strong><br>
            You can now login to your account and start uploading your books, managing your publications, and reaching thousands of readers.
          </div>
          <p>As an approved publisher, you can:</p>
          <ul>
            <li>Upload and manage your book catalog</li>
            <li>Track downloads and reader engagement</li>
            <li>Access detailed analytics and reports</li>
            <li>Reach our growing community of readers</li>
          </ul>
          <div style="text-align: center; margin-top: 30px;">
            <a href="/login" class="cta-button">Login to Publisher Dashboard 🚀</a>
          </div>
          <div class="signature">
            Thanks & Regards,<br>
            <b>Team IntelliRead</b>
          </div>
        </div>
        <div class="footer">
          <b>Smart Reading — Smarter Learning 📖✨</b>
        </div>
      </div>
    </body>
    </html>
    `;
  } else {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Publisher Application Update - IntelliRead</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: linear-gradient(135deg, #fdfcfb, #e2d1c3); margin: 0; padding: 40px 0; color: #333; }
        .email-container { background-color: #fff; max-width: 650px; margin: 0 auto; border-radius: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); overflow: hidden; border: 1px solid #f0f0f0; }
        .header { background: linear-gradient(135deg, #f44336, #d32f2f); padding: 25px; text-align: center; }
        .logo img { height: 90px; width: auto; border-radius: 8px; }
        .content { padding: 35px; }
        .greeting { font-size: 18px; font-weight: 500; color: #333; margin-bottom: 15px; }
        .highlight { color: #f44336; font-weight: 600; }
        p { line-height: 1.7; font-size: 15px; color: #555; margin-bottom: 16px; }
        .message { background-color: #ffebee; border-left: 5px solid #f44336; padding: 16px; border-radius: 8px; font-size: 15px; color: #444; margin: 25px 0; }
        .signature { margin-top: 25px; font-style: italic; color: #666; }
        .footer { background-color: #fafafa; padding: 25px; text-align: center; font-size: 13px; color: #777; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="logo">
            <img src="../images/logo.png" alt="IntelliRead Logo">
          </div>
        </div>
        <div class="content">
          <div class="greeting">Hi <span class="highlight">${userName}</span>,</div>
          <p>Thank you for your interest in becoming a publisher with <b>IntelliRead</b>.</p>
          <div class="message">
            <strong>Application Status: Not Approved</strong><br>
            After careful review, we regret to inform you that your publisher application has not been approved at this time.
          </div>
          <p>This decision may be due to various factors including current platform needs, content guidelines, or other considerations.</p>
          <p>We appreciate your interest and encourage you to explore our platform as a reader. You're welcome to reapply in the future.</p>
          <div class="signature">
            Thanks & Regards,<br>
            <b>Team IntelliRead</b>
          </div>
        </div>
        <div class="footer">
          <b>Smart Reading — Smarter Learning 📖✨</b>
        </div>
      </div>
    </body>
    </html>
    `;
  }
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
  isApproved: { 
    type: Boolean, 
    default: function() {
      return this.role === 'user'; // Auto-approve users, require approval for publishers
    }
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

// ===== CREATE MULTIPLE DEFAULT ADMIN ACCOUNTS =====
async function createDefaultAdmins() {
  try {
    const defaultAdmins = [
      {
        username: 'superadmin',
        email: 'admin@intelliread.com',
        password: 'teamRv$04',
        role: 'superadmin'
      },
      {
        username: 'ravi',
        email: 'ravi@intelliread.com',
        password: 'teamRavi$04',
        role: 'admin'
      },
      {
        username: 'aarti',
        email: 'aarti@intelliread.com',
        password: 'teamAarti$04',
        role: 'admin'
      },
      {
        username: 'vicky',
        email: 'vicky@intelliread.com',
        password: 'teamVicky$04',
        role: 'admin'
      },
      {
        username: 'arpit',
        email: 'arpit@intelliread.com',
        password: 'teamArpit$04',
        role: 'admin'
      }
      
    ];

    for (const adminData of defaultAdmins) {
      const existingAdmin = await Admin.findOne({ email: adminData.email });
      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(adminData.password, 10);
        const admin = new Admin({
          username: adminData.username,
          email: adminData.email,
          password: hashedPassword,
          role: adminData.role
        });
        await admin.save();
        console.log(`✅ Admin account created: ${adminData.email}`);
        console.log(`   Username: ${adminData.username} | Password: ${adminData.password} | Role: ${adminData.role}`);
      } else {
        console.log(`ℹ️  Admin account already exists: ${adminData.email}`);
      }
    }
    
    console.log('🎯 All default admin accounts setup completed');

  } catch (error) {
    console.log('⚠️  Admin creation skipped (already exists)');
  }
}

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/intelliread')
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    createDefaultAdmins(); // Create multiple default admins after connection
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
  if (req.session && req.session.user && req.session.user.role === 'publisher' && req.session.user.isApproved) {
    console.log('🔒 Publisher authenticated:', req.session.user.email);
    next();
  } else {
    console.log('❌ Unauthorized access attempt to publisher route');
    res.status(403).json({ 
      success: false, 
      message: 'Forbidden: Approved publisher access required' 
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
    const users = await User.find().select('email role fullName createdAt isApproved');
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

// Debug endpoint to check admins
app.get("/api/debug/admins", async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    res.json({
      success: true,
      admins: admins
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

    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalPublishers = await User.countDocuments({ role: 'publisher', isApproved: true });
    const pendingPublishers = await User.countDocuments({ role: 'publisher', isApproved: false });
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
      pendingPublishers,
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

// Get Pending Publishers for Admin
app.get("/api/admin/pending-publishers", requireAdminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const pendingPublishers = await User.find({ 
      role: 'publisher', 
      isApproved: false 
    })
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const totalPending = await User.countDocuments({ 
      role: 'publisher', 
      isApproved: false 
    });

    res.json({
      success: true,
      pendingPublishers,
      totalPages: Math.ceil(totalPending / limit),
      currentPage: page,
      totalPending
    });

  } catch (error) {
    console.error('❌ Get pending publishers error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching pending publishers' 
    });
  }
});

// Approve/Reject Publisher
app.put("/api/admin/publishers/:id/approve", requireAdminAuth, async (req, res) => {
  try {
    const publisherId = req.params.id;
    const { approve } = req.body;

    const publisher = await User.findById(publisherId);
    
    if (!publisher || publisher.role !== 'publisher') {
      return res.status(404).json({
        success: false,
        message: 'Publisher not found'
      });
    }

    if (approve) {
      publisher.isApproved = true;
      await publisher.save();
      
      // Send approval email
      sendPublisherApprovalResultEmail(publisher.email, publisher.fullName, true);
      
      console.log('✅ Publisher approved:', publisher.email);
      
      res.json({
        success: true,
        message: 'Publisher approved successfully',
        publisher: {
          id: publisher._id,
          fullName: publisher.fullName,
          email: publisher.email,
          role: publisher.role,
          isApproved: publisher.isApproved
        }
      });
    } else {
      // Reject and delete publisher account
      await User.findByIdAndDelete(publisherId);
      
      // Send rejection email
      sendPublisherApprovalResultEmail(publisher.email, publisher.fullName, false);
      
      console.log('❌ Publisher rejected and deleted:', publisher.email);
      
      res.json({
        success: true,
        message: 'Publisher rejected and account removed'
      });
    }

  } catch (error) {
    console.error('❌ Approve publisher error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error processing publisher approval' 
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
      .populate('uploadedBy', 'fullName email role isApproved')
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
    ).populate('uploadedBy', 'fullName email role isApproved');

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

// User Signup endpoint with publisher approval
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

    // Auto-approve users, require approval for publishers
    const isApproved = role === 'user';

    // Create new user
    const newUser = new User({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role,
      isApproved: isApproved
    });

    // Save to database
    await newUser.save();
    console.log('✅ User saved to database:', newUser.email, 'Role:', newUser.role, 'Approved:', newUser.isApproved);

    // Create user session only if approved
    if (newUser.isApproved) {
      req.session.user = {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        isApproved: newUser.isApproved
      };
    }

    // Send appropriate email based on approval status
    if (role === 'publisher' && !isApproved) {
      // Send pending approval email
      sendPublisherApprovalEmail(newUser.email, newUser.fullName);
    } else {
      // Send welcome email
      sendWelcomeEmail(newUser.email, newUser.fullName, newUser.role);
    }

    const message = role === 'publisher' 
      ? 'Publisher account created successfully. Please wait for admin approval before logging in.'
      : 'User account created successfully';

    res.status(201).json({ 
      success: true,
      message: message,
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        isApproved: newUser.isApproved
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

// User Login endpoint with publisher approval check
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

    console.log('✅ User found:', user.email, 'Role:', user.role, 'Approved:', user.isApproved);

    // Check if publisher is approved
    if (user.role === 'publisher' && !user.isApproved) {
      console.log('❌ Publisher not approved:', user.email);
      return res.status(403).json({ 
        success: false,
        message: 'Your publisher account is pending admin approval. Please wait for approval email.' 
      });
    }

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
      isApproved: user.isApproved,
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
        isApproved: user.isApproved,
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

    // Check if publisher is approved
    if (user.role === 'publisher' && !user.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Your publisher account is pending admin approval. Please wait for approval email.',
        isApproved: false
      });
    }

    res.json({
      success: true,
      message: 'Role validation successful',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved
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
        isApproved: user.isApproved,
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
      .populate('uploadedBy', 'fullName email role isApproved')
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
      .populate('uploadedBy', 'fullName email role isApproved');

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

// ===== PASSWORD RESET ROUTES ===== 

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map();

// Generate random OTP - 4 digits
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString(); // This generates 4-digit OTP
}

// Function to send OTP email
async function sendOTPEmail(userEmail, userName, otp) {
  try {
    const mailOptions = {
      from: 'noreply.intelliread@gmail.com',
      to: userEmail,
      subject: 'Password Reset OTP - IntelliRead',
      html: generateOTPEmailHTML(userName, otp)
    };
    
    await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent to:', userEmail);
    return true;
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error);
    return false;
  }
}

// Function to generate OTP email HTML
function generateOTPEmailHTML(userName, otp) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Reset OTP - IntelliRead</title>
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; background: linear-gradient(135deg, #fdfcfb, #e2d1c3); margin: 0; padding: 40px 0; color: #333; }
      .email-container { background-color: #fff; max-width: 650px; margin: 0 auto; border-radius: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); overflow: hidden; border: 1px solid #f0f0f0; }
      .header { background: linear-gradient(135deg, #667eea, #764ba2); padding: 25px; text-align: center; }
      .logo img { height: 90px; width: auto; border-radius: 8px; }
      .content { padding: 35px; }
      .greeting { font-size: 18px; font-weight: 500; color: #333; margin-bottom: 15px; }
      .highlight { color: #667eea; font-weight: 600; }
      p { line-height: 1.7; font-size: 15px; color: #555; margin-bottom: 16px; }
      .otp-container { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px; border-radius: 10px; text-align: center; margin: 25px 0; font-size: 32px; font-weight: bold; letter-spacing: 8px; }
      .message { background-color: #f8f9ff; border-left: 5px solid #667eea; padding: 16px; border-radius: 8px; font-size: 14px; color: #444; margin: 25px 0; }
      .signature { margin-top: 25px; font-style: italic; color: #666; }
      .footer { background-color: #fafafa; padding: 25px; text-align: center; font-size: 13px; color: #777; border-top: 1px solid #eee; }
      .footer b { display: block; font-size: 14px; color: #333; margin-bottom: 8px; }
      .contact-info { margin-top: 10px; line-height: 1.8; }
      .footer a { color: #667eea; text-decoration: none; font-weight: 500; }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <div class="logo">
          <img src="../images/logo.png" alt="IntelliRead Logo">
        </div>
      </div>
      <div class="content">
        <div class="greeting">Hi <span class="highlight">${userName}</span>,</div>
        <p>You requested to reset your password for your IntelliRead account.</p>
        <p>Use the following OTP to verify your identity and reset your password:</p>
        
        <div class="otp-container">${otp}</div>
        
        <div class="message">
          <strong>This OTP is valid for 10 minutes.</strong><br>
          If you didn't request this password reset, please ignore this email or contact support if you have concerns.
        </div>
        
        <div class="signature">
          Thanks & Regards,<br>
          <b>Team IntelliRead</b>
        </div>
      </div>
      <div class="footer">
        <b>Smart Reading — Smarter Learning 📖✨</b>
        <div class="contact-info">
          📚 Secure AI-Based Online Book Reading Platform<br>
          📧 <a href="mailto:contact@intelliread.com">contact@intelliread.com</a>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
}

// Send OTP for password reset
app.post("/api/forgot-password/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    console.log('🔐 Password reset OTP request for:', email);

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
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

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists in either User or Admin collection
    let user = await User.findOne({ email: normalizedEmail });
    let userType = 'user';
    
    if (!user) {
      // Check if it's an admin
      user = await Admin.findOne({ email: normalizedEmail });
      userType = 'admin';
    }

    if (!user) {
      console.log('❌ No account found with email:', normalizedEmail);
      return res.status(404).json({ 
        success: false,
        message: 'No account found with this email address' 
      });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP with expiration (10 minutes)
    otpStore.set(normalizedEmail, {
      otp: otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      userType: userType,
      userId: user._id
    });

    console.log(`✅ OTP generated for ${normalizedEmail}: ${otp} (Type: ${userType})`);

    // Send OTP email
    const emailSent = await sendOTPEmail(
      normalizedEmail, 
      user.fullName || user.username, 
      otp
    );

    if (!emailSent) {
      return res.status(500).json({ 
        success: false,
        message: 'Failed to send OTP email. Please try again.' 
      });
    }

    res.json({
      success: true,
      message: 'OTP sent successfully to your email',
      userType: userType
    });

  } catch (error) {
    console.error('❌ Send OTP error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error. Please try again.' 
    });
  }
});

// Verify OTP
app.post("/api/forgot-password/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log('🔐 OTP verification attempt for:', email);

    if (!email || !otp) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and OTP are required' 
      });
    }

     // Add 4-digit OTP validation
    if (otp.length !== 4) {
      return res.status(400).json({ 
        success: false,
        message: 'OTP must be 4 digits' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if OTP exists and is valid
    const otpData = otpStore.get(normalizedEmail);
    
    if (!otpData) {
      return res.status(400).json({ 
        success: false,
        message: 'OTP not found or expired. Please request a new OTP.' 
      });
    }

    // Check if OTP is expired
    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(normalizedEmail);
      return res.status(400).json({ 
        success: false,
        message: 'OTP has expired. Please request a new OTP.' 
      });
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid OTP. Please try again.' 
      });
    }

    // OTP is valid - mark as verified
    otpStore.set(normalizedEmail, {
      ...otpData,
      verified: true
    });

    console.log('✅ OTP verified successfully for:', normalizedEmail);

    res.json({
      success: true,
      message: 'OTP verified successfully',
      userType: otpData.userType
    });

  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error. Please try again.' 
    });
  }
});

// Reset password
app.post("/api/forgot-password/reset", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    console.log('🔐 Password reset attempt for:', email);

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Email, OTP, and new password are required' 
      });
    }

    // Validate password length
    if (newPassword.length < 8) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 8 characters long' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verify OTP again
    const otpData = otpStore.get(normalizedEmail);
    
    if (!otpData || !otpData.verified || otpData.otp !== otp) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or unverified OTP. Please verify OTP first.' 
      });
    }

    // Check if OTP is expired
    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(normalizedEmail);
      return res.status(400).json({ 
        success: false,
        message: 'OTP has expired. Please request a new OTP.' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password based on user type
    let updatedUser;
    if (otpData.userType === 'admin') {
      updatedUser = await Admin.findByIdAndUpdate(
        otpData.userId,
        { password: hashedPassword },
        { new: true }
      ).select('-password');
    } else {
      updatedUser = await User.findByIdAndUpdate(
        otpData.userId,
        { password: hashedPassword },
        { new: true }
      ).select('-password');
    }

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Clear OTP from store
    otpStore.delete(normalizedEmail);

    console.log('✅ Password reset successfully for:', normalizedEmail);

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error. Please try again.' 
    });
  }
});

// Resend OTP
app.post("/api/forgot-password/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    let user = await User.findOne({ email: normalizedEmail });
    let userType = 'user';
    
    if (!user) {
      user = await Admin.findOne({ email: normalizedEmail });
      userType = 'admin';
    }

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'No account found with this email address' 
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    
    // Store new OTP with expiration
    otpStore.set(normalizedEmail, {
      otp: otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      userType: userType,
      userId: user._id
    });

    console.log(`✅ New OTP generated for ${normalizedEmail}: ${otp}`);

    // Send new OTP email
    const emailSent = await sendOTPEmail(
      normalizedEmail, 
      user.fullName || user.username, 
      otp
    );

    if (!emailSent) {
      return res.status(500).json({ 
        success: false,
        message: 'Failed to send OTP email. Please try again.' 
      });
    }

    res.json({
      success: true,
      message: 'New OTP sent successfully to your email'
    });

  } catch (error) {
    console.error('❌ Resend OTP error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error. Please try again.' 
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
app.get("/user", (req, res) => {
  res.sendFile(path.join(__dirname, "User.html"));
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
app.get("/bookscreen", (req, res) => {
  res.sendFile(path.join(__dirname, "BookScreen.html"));
});

app.get("/forgotpassword", (req, res) => {
  res.sendFile(path.join(__dirname, "ForgotPass.html"));
});


// Publisher Dashboard
app.get("/publisher-dashboard", requirePublisherAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard", "Publisher.html"));
});

// User Dashboard
app.get("/user-dashboard", requireUserAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard", "User.html"));
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
const PORT = 5000;
app.listen(PORT, () => {
  console.log("=".repeat(60));
  console.log("🚀 SERVER STARTED SUCCESSFULLY");
  console.log("=".repeat(60));
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`📍 Network: http://127.0.0.1:${PORT}`);
  console.log("📧 Email system: Ready");
  console.log("👥 Role-based access: Enabled");
  console.log("🔐 Multiple Admin Accounts Created:");
  console.log("   👑 SuperAdmin: admin@intelliread.com (teamRv$04)");
  console.log("   👥 Additional admins created with team passwords");
  console.log("📚 User roles: User (Auto-approved), Publisher (Requires Admin Approval)");
  console.log("🔐 Authentication: Session-based with publisher approval system");
  console.log("📊 Analytics: Login tracking, download/read counts");
  console.log("🐛 Debug endpoints: /api/debug/users, /api/debug/admins");
});