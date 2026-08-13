const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const { router: authRoutes, seedSuperAdmin } = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const userRoutes = require('./routes/userRoutes');
const lectureRoutes = require('./routes/lectureRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const reportRoutes = require('./routes/reportRoutes');
const systemRoutes = require('./routes/systemRoutes');

const app = express();

// Database Connection & Seeding
connectDB().then(() => {
  seedSuperAdmin();
});

// HTTP Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-Memory Login Rate Limiter (Max 15 attempts per 15 mins per IP)
const loginAttempts = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 15;

const loginRateLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const now = Date.now();

  let record = loginAttempts.get(ip);
  if (!record) {
    record = { count: 1, startTime: now };
    loginAttempts.set(ip, record);
    return next();
  }

  if (now - record.startTime > RATE_LIMIT_WINDOW_MS) {
    record.count = 1;
    record.startTime = now;
    loginAttempts.set(ip, record);
    return next();
  }

  record.count++;
  if (record.count > MAX_LOGIN_ATTEMPTS) {
    return res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again after 15 minutes for security reasons.'
    });
  }

  next();
};

// Serve static assets from public folder with No-Cache headers
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// Apply Rate Limiting to Auth Endpoints
app.use('/api/auth/login-step1', loginRateLimiter);
app.use('/api/auth/verify-security', loginRateLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lectures', lectureRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/system', systemRoutes);

// Health check / API status endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Attendance System API is running smoothly with active security headers & rate limiting.',
    timestamp: new Date()
  });
});

// Default Fallback Route
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` Attendance System Server active on port ${PORT}`);
  console.log(` Security Headers & 5-Min Auto-Logout Active`);
  console.log(` Local URL: http://localhost:${PORT}`);
  console.log(`=================================================`);
});
