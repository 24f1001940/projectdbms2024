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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// ------------------------------------------------------------
// DATABASE INIT
// ------------------------------------------------------------
const { sequelize } = require('./config/db');
const bcrypt = require('bcrypt');
const { User, Canteen, Item } = require('./models');

const systemLogs = [];
app.set('systemLogs', systemLogs);
app.set('logEvent', (type, message, meta = {}) => {
  systemLogs.push({
    id: systemLogs.length + 1,
    type,
    message,
    meta,
    createdAt: new Date().toISOString()
  });
  if (systemLogs.length > 200) {
    systemLogs.shift();
  }
});

const defaultCanteens = [
  {
    name: 'Central Canteen',
    location: 'Near Gate 7',
    description: 'Campus hub for hearty meals and quick student favorites.',
    items: [
      { name: 'Chicken Biryani', price: 120, category: 'meals' },
      { name: 'Veg Thali', price: 80, category: 'meals' },
      { name: 'Samosa', price: 15, category: 'snacks' },
      { name: 'Masala Tea', price: 10, category: 'drinks' },
      { name: 'Cold Coffee', price: 40, category: 'drinks' }
    ]
  },
  {
    name: 'Castro Cafe',
    location: 'Near Library',
    description: 'Coffee, sandwiches, and study-session essentials.',
    items: [
      { name: 'Paneer Patties', price: 25, category: 'snacks' },
      { name: 'Chicken Sandwich', price: 50, category: 'snacks' },
      { name: 'Espresso', price: 30, category: 'drinks' },
      { name: 'Blueberry Muffin', price: 60, category: 'snacks' },
      { name: 'Iced Tea', price: 35, category: 'drinks' }
    ]
  },
  {
    name: 'FET Canteen',
    location: 'Engineering Block',
    description: 'Fast, filling meals for busy engineering students.',
    items: [
      { name: 'Chole Bhature', price: 60, category: 'meals' },
      { name: 'Maggi', price: 30, category: 'snacks' },
      { name: 'Bread Pakora', price: 20, category: 'snacks' },
      { name: 'Lassi', price: 40, category: 'drinks' },
      { name: 'Burger', price: 45, category: 'snacks' }
    ]
  },
  {
    name: 'Hygienic Canteen',
    location: 'Hostel Area',
    description: 'Fresh, clean, and balanced meals for daily dining.',
    items: [
      { name: 'Fruit Salad', price: 50, category: 'snacks' },
      { name: 'Boiled Eggs', price: 20, category: 'snacks' },
      { name: 'Fresh Lime Soda', price: 25, category: 'drinks' },
      { name: 'Oats Meal', price: 70, category: 'meals' },
      { name: 'Green Tea', price: 15, category: 'drinks' }
    ]
  }
];

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
    await User.create({
      name: 'Administrator',
      email: adminEmail,
      password_hash: hash,
      role: 'admin',
      email_verified: true
    });
    console.log('Admin account created:', adminEmail);
  } catch (err) {
    console.error('ensureAdmin error', err);
  }
}

async function ensureDemoData() {
  const count = await Canteen.count();
  if (count > 0) {
    return;
  }

  for (const canteenData of defaultCanteens) {
    const canteen = await Canteen.create({
      name: canteenData.name,
      location: canteenData.location,
      description: canteenData.description,
      is_active: true
    });

    for (const item of canteenData.items) {
      await Item.create({
        ...item,
        canteen_id: canteen.id,
        stock: 100,
        is_active: true
      });
    }

    const ownerEmail = `owner_canteen${canteen.id}@gmail.com`;
    const ownerPass = `canteen${canteen.id}`;
    const ownerHash = await bcrypt.hash(ownerPass, 10);
    await User.create({
      name: `${canteen.name} Owner`,
      email: ownerEmail,
      password_hash: ownerHash,
      role: 'owner',
      canteen_id: canteen.id,
      email_verified: true
    });
  }
}

// In serverless, we sync on first request or startup, but carefully.
// We'll wrap it in a middleware or just call it once.
let isSynced = false;
app.use(async (req, res, next) => {
  if (!isSynced && process.env.NODE_ENV === 'production') {
    try {
      await sequelize.sync({ alter: false });
      await ensureAdmin();
      await ensureDemoData();
      isSynced = true;
    } catch (err) {
      console.error("Delayed Sync Error:", err);
    }
  }
  next();
});

if (process.env.NODE_ENV !== 'production') {
  sequelize.sync({ alter: true }).then(async () => {
    await ensureAdmin();
    await ensureDemoData();
  });
}

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
  res.sendFile(path.join(__dirname, 'public', 'mainpage.html'));
});

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
  });
}

module.exports = app;
