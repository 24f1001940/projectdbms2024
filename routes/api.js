// routes/api.js
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const orderController = require('../controllers/orderController');
const itemController = require('../controllers/itemController');
const adminController = require('../controllers/adminController');
const ownerController = require('../controllers/ownerController');  // <-- MUST EXIST

const { auth, roleCheck } = require('../middlewares/auth');

// ================= AUTH ==================
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/refresh', authController.refreshToken);
router.post('/auth/logout', auth, authController.logout);

// ================= PROFILE =================
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);

// ================= PUBLIC =================
router.get('/items', itemController.listItems);
router.get('/canteens', itemController.listCanteens);
router.get('/canteens/:id/menu', itemController.menuByCanteen);

// ================= USER ORDERS =============
router.post('/orders', auth, orderController.createOrder);
router.get('/orders/my', auth, orderController.listUserOrders); // NEW ROUTE
router.get('/orders/:id', auth, orderController.getOrderById);

// ================= ADMIN ===================
router.get('/admin/users', auth, roleCheck('admin'), adminController.listUsers);
router.get('/admin/orders', auth, roleCheck('admin'), adminController.listOrders);
router.post('/admin/canteens', auth, roleCheck('admin'), adminController.createCanteen);
router.post('/admin/create-owner', auth, roleCheck('admin'), adminController.createOwner);
router.get('/admin/export', auth, roleCheck('admin'), adminController.exportData);

// ================= OWNER ===================
router.get("/owner/orders", auth, roleCheck("owner"), ownerController.listOrdersForOwner);
router.put("/owner/orders/:id/status", auth, roleCheck("owner"), ownerController.updateOrderStatus);
router.put("/owner/items/:id/toggle", auth, roleCheck("owner"), ownerController.toggleItem);
router.delete("/owner/items/:id", auth, roleCheck("owner"), ownerController.deleteItem);


router.post(
  '/owner/items',
  auth,
  roleCheck('owner'),
  ownerController.addItem                // <-- MUST exist
);

router.put(
  '/owner/items/:id',
  auth,
  roleCheck('owner'),
  ownerController.updateItem             // <-- MUST exist
);

module.exports = router;
