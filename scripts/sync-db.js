require('dotenv').config();
const { sequelize } = require('../config/db');
const models = require('../models');

(async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("Database synced successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Sync failed:", error);
    process.exit(1);
  }
})();
