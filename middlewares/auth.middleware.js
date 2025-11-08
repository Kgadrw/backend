import User from '../models/user.model.js';

// @desc    Middleware to protect routes using database tokens
// @route   All protected routes
// @access  Private
export const protect = async (req, res, next) => {
  let token;

  // Get token from Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.headers.authorization) {
    // Also support token without "Bearer" prefix
    token = req.headers.authorization;
  }

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Not authorized, no token provided' 
    });
  }

  try {
    // Find user by token
    const user = await User.findOne({ token });

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ 
      success: false,
      message: 'Not authorized, token failed' 
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: `Access denied. Required roles: ${roles.join(', ')}` });
    }

    next();
  };
};

export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (
    !authHeader ||
    (authHeader && authHeader.trim().length === 0)
  ) {
    return next();
  }

  let token = authHeader.startsWith('Bearer')
    ? authHeader.split(' ')[1]
    : authHeader;

  if (!token) {
    return next();
  }

  try {
    const user = await User.findOne({ token });
    if (user) {
      req.user = user;
    }
  } catch (error) {
    console.error('Optional auth error:', error);
  }

  next();
};

