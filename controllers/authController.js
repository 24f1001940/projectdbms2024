const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const ACCESS_TTL = '1h';
const REFRESH_TTL = '7d';

const refreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh_secret_456';
const accessSecret = process.env.JWT_SECRET || 'jwt_secret_123';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const isStrongPassword = (password) => {
  if (typeof password !== 'string' || password.length < 8) return false;
  return /[a-z]/i.test(password) && /\d/.test(password);
};

const generateAccessToken = (user) => jwt.sign(
  {
    id: user.id,
    email: user.email,
    role: user.role,
    canteen_id: user.canteen_id,
    tokenVersion: user.token_version || 0
  },
  accessSecret,
  { expiresIn: ACCESS_TTL }
);

const generateRefreshToken = (user) => jwt.sign(
  {
    id: user.id,
    tokenVersion: user.token_version || 0
  },
  refreshSecret,
  { expiresIn: REFRESH_TTL }
);

const serializeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  canteen_id: user.canteen_id,
  avatar: user.avatar,
  email_verified: user.email_verified,
  token_version: user.token_version
});

const issueSession = async (user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await user.update({
    refresh_token_hash: hashToken(refreshToken),
    refresh_token_expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    last_login_at: new Date()
  });

  return { accessToken, refreshToken };
};

exports.register = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters and include letters and numbers' });
    }

    const exists = await User.findOne({ where: { email } });
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const verificationToken = crypto.randomBytes(24).toString('hex');
    const verificationRequired = process.env.EMAIL_VERIFICATION_REQUIRED === 'true';

    const user = await User.create({
      name,
      email,
      password_hash: await bcrypt.hash(password, 12),
      role: 'user',
      email_verified: !verificationRequired,
      email_verification_token: verificationRequired ? hashToken(verificationToken) : null,
      email_verification_expires: verificationRequired ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null
    });

    return res.status(201).json({
      message: verificationRequired
        ? 'Account created. Please verify your email to continue.'
        : 'Account created successfully. Please login.',
      verificationRequired,
      verificationToken: verificationRequired ? verificationToken : null,
      user: serializeUser(user)
    });
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const token = String(req.body.token || req.query.token || '').trim();
    const email = normalizeEmail(req.body.email || req.query.email);

    if (!token || !email) {
      return res.status(400).json({ message: 'Token and email are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !user.email_verification_token || !user.email_verification_expires) {
      return res.status(404).json({ message: 'Verification record not found' });
    }

    if (user.email_verification_expires.getTime() < Date.now()) {
      return res.status(400).json({ message: 'Verification token expired' });
    }

    if (user.email_verification_token !== hashToken(token)) {
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    await user.update({
      email_verified: true,
      email_verification_token: null,
      email_verification_expires: null
    });

    return res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error('VERIFY EMAIL ERROR:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const expectedRole = req.body.loginRole || 'user';

    if (!email || !password) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (user.role !== expectedRole) {
      return res.status(403).json({ message: `Access denied. Use the ${user.role} portal for this account.` });
    }

    if (!user.email_verified && process.env.EMAIL_VERIFICATION_REQUIRED === 'true') {
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const { accessToken, refreshToken } = await issueSession(user);

    return res.json({
      message: 'Login successful',
      token: accessToken,
      refreshToken,
      user: serializeUser(user)
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, refreshSecret);
    const user = await User.findByPk(decoded.id);

    if (!user || user.token_version !== decoded.tokenVersion) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    if (!user.refresh_token_hash || user.refresh_token_hash !== hashToken(refreshToken)) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    if (user.refresh_token_expires && user.refresh_token_expires.getTime() < Date.now()) {
      return res.status(403).json({ message: 'Refresh token expired' });
    }

    const nextRefreshToken = generateRefreshToken(user);
    const nextAccessToken = generateAccessToken(user);

    await user.update({
      refresh_token_hash: hashToken(nextRefreshToken),
      refresh_token_expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    return res.json({ token: nextAccessToken, refreshToken: nextRefreshToken, user: serializeUser(user) });
  } catch (err) {
    return res.status(403).json({ message: 'Expired or invalid refresh token' });
  }
};

exports.logout = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (user) {
      await user.update({ refresh_token_hash: null, refresh_token_expires: null });
    }
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.logoutAll = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (user) {
      await user.update({
        refresh_token_hash: null,
        refresh_token_expires: null,
        token_version: (user.token_version || 0) + 1
      });
    }
    return res.json({ message: 'Logged out from all devices' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.json({ message: 'If the account exists, a reset link has been generated.' });
    }

    const resetToken = crypto.randomBytes(24).toString('hex');
    await user.update({
      reset_token_hash: hashToken(resetToken),
      reset_expires: new Date(Date.now() + 60 * 60 * 1000)
    });

    return res.json({
      message: 'Password reset token generated',
      resetToken,
      expiresInMinutes: 60
    });
  } catch (err) {
    console.error('FORGOT PASSWORD ERROR:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const token = String(req.body.token || '').trim();
    const password = String(req.body.password || '');

    if (!email || !token || !password) {
      return res.status(400).json({ message: 'Email, token and password are required' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters and include letters and numbers' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !user.reset_token_hash || !user.reset_expires) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    if (user.reset_expires.getTime() < Date.now() || user.reset_token_hash !== hashToken(token)) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    await user.update({
      password_hash: await bcrypt.hash(password, 12),
      reset_token_hash: null,
      reset_expires: null,
      token_version: (user.token_version || 0) + 1,
      refresh_token_hash: null,
      refresh_token_expires: null,
      password_changed_at: new Date()
    });

    return res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('RESET PASSWORD ERROR:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: [
        'id',
        'name',
        'email',
        'role',
        'avatar',
        'canteen_id',
        'email_verified',
        'createdAt',
        'last_login_at'
      ]
    });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, avatar } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email && normalizeEmail(email) !== user.email) {
      const exists = await User.findOne({ where: { email: normalizeEmail(email) } });
      if (exists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    const nextEmail = email ? normalizeEmail(email) : user.email;
    const verificationRequired = process.env.EMAIL_VERIFICATION_REQUIRED === 'true';
    const nextAvatar = req.file ? `/uploads/${req.file.filename}` : (avatar || user.avatar);

    await user.update({
      name: name ? String(name).trim() : user.name,
      email: nextEmail,
      avatar: nextAvatar,
      email_verified: verificationRequired && nextEmail !== user.email ? false : user.email_verified
    });

    return res.json({ message: 'Profile updated', user: serializeUser(user) });
  } catch (err) {
    console.error('UPDATE PROFILE ERROR:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const currentPassword = String(req.body.currentPassword || '');
    const nextPassword = String(req.body.newPassword || '');

    if (!currentPassword || !nextPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (!isStrongPassword(nextPassword)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters and include letters and numbers' });
    }

    const user = await User.findByPk(req.user.id);
    const ok = await bcrypt.compare(currentPassword, user.password_hash);
    if (!ok) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    await user.update({
      password_hash: await bcrypt.hash(nextPassword, 12),
      token_version: (user.token_version || 0) + 1,
      refresh_token_hash: null,
      refresh_token_expires: null,
      password_changed_at: new Date()
    });

    const { accessToken, refreshToken } = await issueSession(user);

    return res.json({
      message: 'Password changed successfully',
      token: accessToken,
      refreshToken,
      user: serializeUser(user)
    });
  } catch (err) {
    console.error('CHANGE PASSWORD ERROR:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.me = exports.getProfile;
