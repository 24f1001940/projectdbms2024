// scripts/fix.js
require('dotenv').config();
const bcrypt = require('bcrypt');

const { sequelize } = require('../config/db');   // <-- FIXED PATH
const { User, Canteen } = require('../models');  // <-- FIXED PATH

(async () => {
  try {
    console.log("Connecting to DB...");
    await sequelize.authenticate();
    console.log("DB connected successfully");

    // -------------------------
    // 1) FIX OWNER ROLES
    // -------------------------
    console.log("Checking owner accounts...");

    const owners = await User.findAll({
      where: sequelize.where(
        sequelize.fn("LOWER", sequelize.col("email")),
        "LIKE",
        "owner_canteen%"
      )
    });

    for (const o of owners) {
      if (o.role !== "owner") {
        console.log(`Updating role -> owner for ${o.email}`);
        o.role = "owner";
        await o.save();
      } else {
        console.log(`Already correct role: ${o.email}`);
      }
    }

    // -------------------------
    // 2) REMOVE DUPLICATE CANTEENS
    // -------------------------
    console.log("Checking duplicate canteens...");

    const allCanteens = await Canteen.findAll({ order: [["id", "ASC"]] });
    const seen = new Map();

    for (const c of allCanteens) {
      const key = (c.name || "").trim().toLowerCase();
      if (!key) continue;

      if (seen.has(key)) {
        console.log(`Deleting duplicate canteen #${c.id} name=${c.name}`);
        await c.destroy();
      } else {
        seen.set(key, c.id);
      }
    }

    console.log("All fixes completed successfully.");
  } catch (err) {
    console.error("Fix script error:", err);
  } finally {
    process.exit(0);
  }
})();
