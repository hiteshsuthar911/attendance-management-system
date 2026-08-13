const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken } = require('../middleware/authMiddleware');

const SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_attendance_system_2026';

// Temporary memory store for pending 6-digit security codes: tempToken -> { securityCode, userId, email, role }
const pendingSecurityCodes = new Map();

// Helper to generate 6-digit numeric security code
const generate6DigitCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Step 1 Login: Validate Email & Password, Issue Temp Token & 6-Digit Security Code
router.post('/login-step1', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const user = await User.findOne({ email }).populate('departments');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Generate 6-digit security code
    const securityCode = generate6DigitCode();

    // Create temporary token for step 2 verification
    const tempToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role, type: '2fa_pending' },
      SECRET,
      { expiresIn: '10m' }
    );

    // Save pending security code mapping
    pendingSecurityCodes.set(tempToken, {
      securityCode,
      userId: user._id.toString(),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        departments: user.departments,
        studentDetails: user.studentDetails
      }
    });

    res.json({
      success: true,
      message: 'Credentials verified. Redirecting to 6-digit security verification page...',
      tempToken,
      securityCode, // Displayed on the security verification page
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during authentication.', error: error.message });
  }
});

// Step 2 Verification: Verify 6-digit security code and issue final JWT token
router.post('/verify-security', async (req, res) => {
  try {
    const { tempToken, inputCode } = req.body;

    if (!tempToken || !inputCode) {
      return res.status(400).json({ success: false, message: 'Temporary session token and 6-digit security code are required.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Security session expired or invalid. Please login again.' });
    }

    const pending = pendingSecurityCodes.get(tempToken);
    if (!pending) {
      return res.status(401).json({ success: false, message: 'Security verification session expired. Please login again.' });
    }

    if (pending.securityCode !== inputCode.toString().trim()) {
      return res.status(400).json({ success: false, message: 'Incorrect 6-digit security code. Please try again.' });
    }

    // Issue final JWT Auth Token
    const user = await User.findById(pending.userId).populate('departments');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const finalToken = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      SECRET,
      { expiresIn: '24h' }
    );

    // Clean up used pending code
    pendingSecurityCodes.delete(tempToken);

    res.json({
      success: true,
      message: 'Security code verified successfully! Redirecting to dashboard...',
      token: finalToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        departments: user.departments,
        studentDetails: user.studentDetails
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to verify security code.', error: error.message });
  }
});

// Refresh 6-digit security code for pending session
router.post('/refresh-security-code', async (req, res) => {
  try {
    const { tempToken } = req.body;
    if (!tempToken) {
      return res.status(400).json({ success: false, message: 'Temporary token required.' });
    }

    const pending = pendingSecurityCodes.get(tempToken);
    if (!pending) {
      return res.status(401).json({ success: false, message: 'Security session expired. Please login again.' });
    }

    const newCode = generate6DigitCode();
    pending.securityCode = newCode;
    pendingSecurityCodes.set(tempToken, pending);

    res.json({
      success: true,
      message: 'New 6-digit security code generated.',
      securityCode: newCode
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to refresh security code.', error: error.message });
  }
});

// Legacy direct login fallback
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email }).populate('departments');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        departments: user.departments,
        studentDetails: user.studentDetails
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error during login.', error: error.message });
  }
});

// Get Current Logged In User Profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('departments')
      .populate('studentDetails.department');
      
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user details.', error: error.message });
  }
});

// Utility to seed initial Superadmin
const seedSuperAdmin = async () => {
  try {
    const superAdminExists = await User.findOne({ role: 'superadmin' });
    if (!superAdminExists) {
      await User.create({
        name: 'Super Admin',
        email: 'superadmin@attendance.com',
        password: 'superadmin123',
        role: 'superadmin'
      });
      console.log('[Seed]: Default Super Admin created (email: superadmin@attendance.com, pass: superadmin123)');
    }
  } catch (err) {
    console.error('[Seed Error]: Failed to create superadmin:', err.message);
  }
};

module.exports = { router, seedSuperAdmin };
