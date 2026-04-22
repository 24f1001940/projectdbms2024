// middlewares/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const auth = async (req, res, next) => {
  try {
    const h = req.headers.authorization || '';
    const token = h.replace('Bearer ', '').trim();
    if (!token) return res.status(401).json({ message: 'No token' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(payload.id);
    if (!user) return res.status(401).json({ message: 'Invalid token (user not found)' });

    if (typeof payload.tokenVersion === 'number' && payload.tokenVersion !== user.token_version) {
      return res.status(401).json({ message: 'Session expired. Please login again.' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      canteen_id: user.canteen_id,
      avatar: user.avatar,
      email_verified: user.email_verified,
      token_version: user.token_version
    };
    next();
  } catch (err) {
    const expired = err && err.name === 'TokenExpiredError';
    return res.status(401).json({
      message: expired ? 'Access token expired' : 'Unauthorized',
      code: expired ? 'TOKEN_EXPIRED' : 'UNAUTHORIZED'
    });
  }
};

const optionalAuth = async (req, _res, next) => {
  try {
    const h = req.headers.authorization || '';
    const token = h.replace('Bearer ', '').trim();
    if (!token) return next();

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(payload.id);
    if (!user) return next();

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      canteen_id: user.canteen_id,
      avatar: user.avatar,
      email_verified: user.email_verified,
      token_version: user.token_version
    };
  } catch (err) {
    // Anonymous access is acceptable here.
  }
  next();
};

const roleCheck = (roles = []) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (!Array.isArray(roles)) roles = [roles];
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  next();
};

module.exports = { auth, optionalAuth, roleCheck };
