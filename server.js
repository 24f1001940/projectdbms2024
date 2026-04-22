require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: "*" } });

// Open browser using dynamic ESM import
const openBrowser = (url) =>
  import('open').then(mod => mod.default(url));

// ------------------------------------------------------------
// REQUIRED MIDDLEWARE (must be before routes)
// ------------------------------------------------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  helmet({
    contentSecurityPolicy: false, // allow inline scripts
  })
);

// ------------------------------------------------------------
// STATIC FILES
// ------------------------------------------------------------
app.use(express.static(path.join(__dirname, 'public')));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// ------------------------------------------------------------
// DATABASE INIT
// ------------------------------------------------------------
const { sequelize } = require('./config/db');

sequelize.authenticate()
  .then(() => console.log("DB connected"))
  .catch(err => console.error("DB connection error:", err));

sequelize.sync()
  .then(() => console.log("Database synced"))
  .catch(err => console.error("Sync error:", err));

// ------------------------------------------------------------
// SOCKET.IO
// ------------------------------------------------------------
app.set("io", io);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  socket.on("join-canteen", (id) => {
    socket.join(`canteen-${id}`);
  });
});

// ------------------------------------------------------------
// API ROUTES
// ------------------------------------------------------------
const apiRoutes = require('./routes/api');
app.use("/api", apiRoutes);

// ------------------------------------------------------------
// BASIC TEST ROUTE
// ------------------------------------------------------------
app.get("/", (req, res) => {
  res.send("Canteen Management API is running");
});
// server.js (after sequelize.sync())
const bcrypt = require('bcrypt');
const { User } = require('./models');

async function ensureAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const adminPass = process.env.ADMIN_PASS || 'admin123';

    const exists = await User.findOne({ where: { email: adminEmail } });
    if (exists) {
      console.log('Admin exists:', adminEmail);
      return;
    }
    const hash = await bcrypt.hash(adminPass, 10);
    const admin = await User.create({
      name: 'Administrator',
      email: adminEmail,
      password_hash: hash,
      role: 'admin'
    });
    console.log('Admin account created:', adminEmail);
  } catch (err) {
    console.error('ensureAdmin error', err);
  }
}

sequelize.sync()
  .then(async () => {
    console.log('Database synced');
    await ensureAdmin();
  })
  .catch(err => console.error('Sync error:', err));

// ------------------------------------------------------------
// START SERVER
// ------------------------------------------------------------
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
  server.listen(PORT, () => {
    console.log("===============================================");
    console.log(`🚀 Server running at:  http://localhost:${PORT}`);
    console.log("📦 Static files served from /public");
    console.log("🛠  API available at /api/*");
    console.log("===============================================");
  
    // Open front page automatically
    // openBrowser(`http://localhost:${PORT}/mainpage.html`);
  });
}

module.exports = app;
