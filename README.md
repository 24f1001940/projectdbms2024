# 🍽️ Jamia Canteen Management System

A premium, high-fidelity web application designed to streamline canteen operations at Jamia Millia Islamia. This system provides a seamless experience for students to order food, for owners to manage their menus and orders, and for administrators to oversee the entire system.

## 🚀 Live Demo
**URL:** [https://projectdbms2024.vercel.app](https://projectdbms2024.vercel.app)

---

## ✨ Key Features

### 👤 User (Student/Faculty)
- **Modern UI:** Beautiful glassmorphism design with a dark mode aesthetic.
- **Browse Canteens:** Explore different canteens on campus.
- **Easy Ordering:** Add items to a persistent cart and place orders instantly.
- **Dashboard:** View profile details and real-time order history.
- **Digital Receipts:** Get printable receipts for every successful order.

### 🏪 Canteen Owner
- **Order Management:** Track incoming orders in real-time.
- **Menu Control:** Add new items to the menu with price and availability.
- **Real-time Updates:** Instant feedback on order status.

### 🛡️ Administrator
- **System Oversight:** Manage all users and canteens from a central dashboard.
- **Owner Creation:** Assign owners to specific canteens with auto-generated credentials.
- **Global Metrics:** Monitor total orders and system activity.

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3 (Custom Glassmorphism), Bootstrap 4, FontAwesome.
- **Backend:** Node.js, Express.js.
- **Database:** Sequelize ORM (Supports **SQLite** for local dev & **MySQL** for production).
- **Deployment:** Vercel (Serverless Functions), Railway (Cloud MySQL).
- **Security:** JWT (JSON Web Tokens) for authentication, Bcrypt for password hashing.

---

## 📂 Project Structure

```text
projectdbms2024/
├── config/             # Database connection logic
├── controllers/        # Business logic (Auth, Orders, Admin, etc.)
├── models/             # Sequelize database models (User, Item, Order, etc.)
├── public/             # Static frontend files (HTML, CSS, JS, Images)
├── routes/             # API route definitions
├── scripts/            # Utility scripts (Sync DB, create admin)
├── server.js           # Main Express server entry point
├── vercel.json         # Vercel deployment configuration
└── .env                # Environment variables (Private)
```

---

## ⚙️ Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/24f1001940/projectdbms2024.git
   cd projectdbms2024
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env` file in the root:
   ```env
   JWT_SECRET=your_secret_key
   ADMIN_EMAIL=admin@gmail.com
   ADMIN_PASS=admin123
   # For local, it will automatically use SQLite.
   # For production, add: DATABASE_URL=mysql://user:pass@host:port/db
   ```

4. **Run the app:**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`

---

## 🔐 Credentials (Initial)

- **Admin Login:** `admin@gmail.com` / `admin123`
- **User Signup:** Create any account via the Signup page.
- **Owner Login:** Created by Admin (Credentials shown upon creation).

---

## 🌐 Deployment to Vercel

The project is configured for **Vercel Serverless Functions**. 
- The `vercel.json` routes all traffic to `server.js`.
- Database synchronization is handled via delayed middleware for serverless compatibility.
- Ensure `JWT_SECRET` and `DATABASE_URL` are added to Vercel's Environment Variables.

---

## 📜 License
This project is for educational purposes as part of the Jamia Millia Islamia DBMS course.

Developed by **Saqib Abubakar**.
