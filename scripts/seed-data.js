// scripts/seed-data.js
require('dotenv').config();
const { sequelize, User, Canteen, Item } = require('../models');
const bcrypt = require('bcrypt');

async function seed() {
  try {
    await sequelize.sync({ force: true });
    console.log('Database synced (force: true)');

    // 1. Create Admin
    const adminPass = process.env.ADMIN_PASS || 'admin123';
    const adminHash = await bcrypt.hash(adminPass, 10);
    await User.create({
      name: 'Super Admin',
      email: process.env.ADMIN_EMAIL || 'admin@gmail.com',
      password_hash: adminHash,
      role: 'admin',
      email_verified: true
    });
    console.log('Admin created');

    // 2. Create Canteens
    const canteens = await Canteen.bulkCreate([
      { name: 'Central Canteen', location: 'Near Gate 7', description: 'Campus hub for hearty meals and quick student favorites.', is_active: true },
      { name: 'Castro Cafe', location: 'Near Library', description: 'Coffee, sandwiches, and study-session essentials.', is_active: true },
      { name: 'FET Canteen', location: 'Engineering Block', description: 'Fast, filling meals for busy engineering students.', is_active: true },
      { name: 'Hygienic Canteen', location: 'Hostel Area', description: 'Fresh, clean, and balanced meals for daily dining.', is_active: true }
    ]);
    console.log('Canteens created');

    // 3. Create Items for each canteen
    const itemData = [
      // Central Canteen
      { name: 'Chicken Biryani', price: 120, category: 'meals', canteen_id: 1 },
      { name: 'Veg Thali', price: 80, category: 'meals', canteen_id: 1 },
      { name: 'Samosa', price: 15, category: 'snacks', canteen_id: 1 },
      { name: 'Masala Tea', price: 10, category: 'drinks', canteen_id: 1 },
      { name: 'Cold Coffee', price: 40, category: 'drinks', canteen_id: 1 },

      // Castro Cafe
      { name: 'Paneer Patties', price: 25, category: 'snacks', canteen_id: 2 },
      { name: 'Chicken Sandwich', price: 50, category: 'snacks', canteen_id: 2 },
      { name: 'Espresso', price: 30, category: 'drinks', canteen_id: 2 },
      { name: 'Blueberry Muffin', price: 60, category: 'snacks', canteen_id: 2 },
      { name: 'Iced Tea', price: 35, category: 'drinks', canteen_id: 2 },

      // FET Canteen
      { name: 'Chole Bhature', price: 60, category: 'meals', canteen_id: 3 },
      { name: 'Maggi', price: 30, category: 'snacks', canteen_id: 3 },
      { name: 'Bread Pakora', price: 20, category: 'snacks', canteen_id: 3 },
      { name: 'Lassi', price: 40, category: 'drinks', canteen_id: 3 },
      { name: 'Burger', price: 45, category: 'snacks', canteen_id: 3 },

      // Hygienic Canteen
      { name: 'Fruit Salad', price: 50, category: 'snacks', canteen_id: 4 },
      { name: 'Boiled Eggs', price: 20, category: 'snacks', canteen_id: 4 },
      { name: 'Fresh Lime Soda', price: 25, category: 'drinks', canteen_id: 4 },
      { name: 'Oats Meal', price: 70, category: 'meals', canteen_id: 4 },
      { name: 'Green Tea', price: 15, category: 'drinks', canteen_id: 4 }
    ];

    await Item.bulkCreate(itemData);
    console.log('Initial items seeded');

    // 4. Create Owners for each canteen
    for (const canteen of canteens) {
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
      console.log(`Owner created for ${canteen.name}: ${ownerEmail}`);
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
