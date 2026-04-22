// middlewares/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const auth = async (req, res, next) => {
  try {
    const h = req.headers.authorization || '';
    const token = h.replace('Bearer ', '').trim();
    if (!token) return res.status(401).json({ message: 'No token' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // fetch fresh user
    const user = await User.findByPk(payload.id);
    if (!user) return res.status(401).json({ message: 'Invalid token (user not found)' });

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      canteen_id: user.canteen_id
    };
    next();
  } catch (err) {
    console.error('Auth middleware error', err);
    return res.status(401).json({ message: 'Unauthorized', error: err.message });
  }
};

const roleCheck = (roles = []) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (!Array.isArray(roles)) roles = [roles];
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  next();
};

module.exports = { auth, roleCheck };
