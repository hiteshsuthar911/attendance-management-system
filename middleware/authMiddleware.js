const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer ')) {
      token = token.split(' ')[1];
    } else if (req.headers['x-auth-token']) {
      token = req.headers['x-auth-token'];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No authentication token provided.' });
    }

    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_attendance_system_2026';
    const decoded = jwt.verify(token, secret);
    
    // Retrieve fresh user details from database
    const user = await User.findById(decoded.id).select('-password').populate('departments');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid authentication token. User not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.', error: error.message });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted for role '${req.user.role}'. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

module.exports = { verifyToken, authorizeRoles };
