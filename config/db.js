const { Sequelize } = require('sequelize');
const path = require('path');

// Use environment variables for production database or fall back to SQLite for local development
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'mysql', // change to 'postgres' if using Supabase/Neon later
      logging: false,
      define: { underscored: true },
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    })
  : new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, '..', 'database.sqlite'),
      logging: false,
      define: { underscored: true }
    });

module.exports = { sequelize, Sequelize };
