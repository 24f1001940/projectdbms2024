# 🍽️ Jamia Canteen Management System v2.0 (Pro)

A production-level, scalable, and modern SaaS-style web application designed to transform campus dining at Jamia Millia Islamia. Featuring advanced authentication, real-time tracking, and professional analytics.

## 🚀 Live Demo
**URL:** [https://projectdbms2024.vercel.app](https://projectdbms2024.vercel.app)

---

## 🌟 Premium Features

### 🛡️ Advanced Authentication & Security
- **JWT Refresh Tokens:** Secure session persistence with access token expiry (1h) and refresh cycles.
- **Role-Based Access Control (RBAC):** Strict validation for Admin, Owner, and User roles.
- **Device Security:** Logout from current session clears refresh tokens from the database.
- **Strict Role Login:** Prevents admin access from user-facing login portals and vice-versa.

### 🎨 Modern UI/UX (Glassmorphism 2.0)
- **Dynamic Theming:** Smooth toggle between **Dark Mode** and **Light Mode**.
- **Sidebar Navigation:** Professional layout for all role-based dashboards.
- **Command Palette:** Quick navigation and search via **Ctrl + K** keyboard shortcut.
- **Toast Notifications:** Real-time feedback for actions like "Added to Bag" or "Status Updated".
- **Responsive Design:** Fully optimized for Mobile, Tablet, and Desktop.

### 👤 User Dashboard & Ordering
- **Persistent Bag:** A modern side-drawer cart that saves your items across sessions.
- **Global Search:** Find any food item instantly across all canteens.
- **Real-Time Tracking:** Watch your order move through states (Pending → Preparing → Ready).
- **Printable Receipts:** Professional digital invoices generated for every order.

### 🏪 Owner Control Panel
- **Live Order Stream:** Real-time Socket.IO notifications for incoming orders.
- **Menu Management:** Add, edit, or toggle visibility of items with a clean table interface.
- **Analytics:** Visualize revenue and popular items using **Chart.js**.

### 🛡️ Admin Super-Command
- **Global KPIs:** Monitor total users, daily orders, and system-wide revenue.
- **User Management:** Promote roles or manage account status.
- **Data Export:** Export Users or Orders data to **CSV** for external reporting.

---

## 🛠️ Modern Tech Stack

- **Frontend:** HTML5, CSS3 (Glassmorphism 2.0), Bootstrap 4, FontAwesome, **Chart.js**.
- **Backend:** Node.js, Express.js, **Socket.io** (Real-time).
- **Database:** Sequelize ORM (MySQL for Production, SQLite for Local).
- **Security:** JWT (Refresh/Access flow), Bcrypt (Hashing).
- **Deployment:** Vercel (Serverless Functions), Railway (MySQL Cluster).

---

## 📂 Project Architecture

```text
projectdbms2024/
├── config/             # Sequelize & DB connection pool
├── controllers/        # Modular business logic (Auth, Admin, Owner, Order)
├── middlewares/        # Security, Auth & Role-check filters
├── models/             # Advanced database schemas & relations
├── public/             # Optimized frontend (app.js utilities, mainpages.css)
├── routes/             # Consistent REST API structure
├── scripts/            # Database seeding & migration tools
├── server.js           # Serverless-ready Express entry point
└── vercel.json         # Production routing & build config
```

---

## ⚙️ Development & Setup

1. **Clone & Install:**
   ```bash
   git clone https://github.com/24f1001940/projectdbms2024.git
   npm install
   ```

2. **Database Seeding (Crucial):**
   Initialize the system with default canteens, items, and owners:
   ```bash
   npm run seed
   ```

3. **Environment Variables (.env):**
   ```env
   JWT_SECRET=asdfghkl@356464
   JWT_REFRESH_SECRET=refresh_secret_987
   ADMIN_EMAIL=admin@gmail.com
   ADMIN_PASS=admin123
   DATABASE_URL=your_mysql_url
   ```

4. **Run Locally:**
   ```bash
   npm run dev
   ```

---

## 🔐 Built-in Test Accounts (After Seeding)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@gmail.com` | `admin123` |
| **Owner (Central)** | `owner_canteen1@gmail.com` | `canteen1` |
| **User** | (Register your own) | (Your choice) |

---

## 📜 License & Credit
This project is an advanced DBMS transformation for Jamia Millia Islamia.

Developed by **Saqib Abubakar**.
