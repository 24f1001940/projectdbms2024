// scripts/create-admin.js
require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize, Sequelize } = require('../config/db'); // adjust path if needed
const { User } = require('../models'); // ensure index.js in models exports User

(async () => {
  try {
    await sequelize.authenticate();
    console.log("DB connected");

    const email = "admin@gmail.com";
    const pw = "admin123";
    const exists = await User.findOne({ where: { email } });
    if (exists) {
      console.log("Admin already exists. Updating role to admin and resetting password.");
      const hash = await bcrypt.hash(pw, 10);
      await exists.update({ role: 'admin', password_hash: hash });
      console.log("Updated existing user to admin.");
    } else {
      const hash = await bcrypt.hash(pw, 10);
      const user = await User.create({ name: "Admin", email, password_hash: hash, role: "admin" });
      console.log("Created admin user:", user.email);
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
})();
