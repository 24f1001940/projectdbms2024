const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models");

// Helpers for token generation
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, canteen_id: user.canteen_id },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET || "refresh_secret_456",
    { expiresIn: "7d" }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "Missing fields" });
    
    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    const exists = await User.findOne({ where: { email } });
    if (exists)
      return res.status(400).json({ message: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password_hash: hash,
      role: "user"
    });

    return res.json({ message: "Account created successfully. Please login." });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, loginRole } = req.body; // loginRole for strict validation

    if (!email || !password)
      return res.status(400).json({ message: "Missing fields" });

    const user = await User.findOne({ where: { email } });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    // Strict Role Validation for Login Pages
    if (loginRole && user.role !== loginRole) {
      return res.status(403).json({ message: `Access denied. Not an ${loginRole} account.` });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok)
      return res.status(400).json({ message: "Invalid email or password" });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in DB for session management
    await user.update({ refresh_token: refreshToken });

    return res.json({
      message: "Login successful",
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        canteen_id: user.canteen_id,
        avatar: user.avatar
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: "Refresh token required" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || "refresh_secret_456");
    const user = await User.findByPk(decoded.id);

    if (!user || user.refresh_token !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = generateAccessToken(user);
    res.json({ token: newAccessToken });
  } catch (err) {
    res.status(403).json({ message: "Expired or invalid refresh token" });
  }
};

exports.logout = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (user) {
      await user.update({ refresh_token: null });
    }
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'role', 'avatar', 'createdAt']
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, avatar } = req.body;
    const user = await User.findByPk(req.user.id);
    
    await user.update({ name, email, avatar });
    res.json({ message: "Profile updated", user: { id: user.id, name, email, avatar, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
