// routes/api.js
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const orderController = require('../controllers/orderController');
const itemController = require('../controllers/itemController');
const adminController = require('../controllers/adminController');
const ownerController = require('../controllers/ownerController');

const { auth, roleCheck } = require('../middlewares/auth');
const rateLimit = require('../middlewares/rateLimit');
const upload = require('../middlewares/upload');

// ================= AUTH ==================
router.post('/auth/register', rateLimit({ keyPrefix: 'register', max: 10, windowMs: 15 * 60 * 1000 }), authController.register);
router.post('/auth/login', rateLimit({ keyPrefix: 'login', max: 15, windowMs: 15 * 60 * 1000 }), authController.login);
router.post('/auth/refresh', authController.refreshToken);
router.post('/auth/verify-email', authController.verifyEmail);
router.post('/auth/forgot-password', rateLimit({ keyPrefix: 'forgot', max: 8, windowMs: 15 * 60 * 1000 }), authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);
router.post('/auth/logout', auth, authController.logout);
router.post('/auth/logout-all', auth, authController.logoutAll);

// ================= PROFILE =================
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, upload.single('avatar'), authController.updateProfile);
router.put('/profile/password', auth, authController.changePassword);
router.get('/auth/me', auth, authController.me);

// ================= PUBLIC =================
router.get('/items', itemController.listItems);
router.get('/canteens', itemController.listCanteens);
router.get('/canteens/:id/menu', itemController.menuByCanteen);

// ================= USER ORDERS =============
router.post('/orders', auth, orderController.createOrder);
router.get('/orders/my', auth, orderController.listUserOrders);
router.get('/orders/:id', auth, orderController.getOrderById);
router.get('/orders/:id/invoice', auth, orderController.getInvoice);
router.get('/orders/:id/invoice.pdf', auth, orderController.getInvoicePdf);

// ================= ADMIN ===================
router.get('/admin/stats', auth, roleCheck('admin'), adminController.dashboardStats);
router.get('/admin/users', auth, roleCheck('admin'), adminController.listUsers);
router.patch('/admin/users/:id/role', auth, roleCheck('admin'), adminController.updateUserRole);
router.delete('/admin/users/:id', auth, roleCheck('admin'), adminController.deleteUser);
router.get('/admin/orders', auth, roleCheck('admin'), adminController.listOrders);
router.get('/admin/canteens', auth, roleCheck('admin'), adminController.listCanteens);
router.post('/admin/canteens', auth, roleCheck('admin'), adminController.createCanteen);
router.put('/admin/canteens/:id', auth, roleCheck('admin'), adminController.updateCanteen);
router.delete('/admin/canteens/:id', auth, roleCheck('admin'), adminController.deleteCanteen);
router.post('/admin/create-owner', auth, roleCheck('admin'), adminController.createOwner);
router.get('/admin/export', auth, roleCheck('admin'), adminController.exportData);
router.get('/admin/logs', auth, roleCheck('admin'), adminController.listLogs);

// ================= OWNER ===================
router.get('/owner/stats', auth, roleCheck('owner'), ownerController.dashboardStats);
router.get('/owner/orders', auth, roleCheck('owner'), ownerController.listOrdersForOwner);
router.put('/owner/orders/:id/status', auth, roleCheck('owner'), ownerController.updateOrderStatus);
router.put('/owner/items/:id/toggle', auth, roleCheck('owner'), ownerController.toggleItem);
router.delete('/owner/items/:id', auth, roleCheck('owner'), ownerController.deleteItem);


router.post(
  '/owner/items',
  auth,
  roleCheck('owner'),
  ownerController.addItem
);

router.put(
  '/owner/items/:id',
  auth,
  roleCheck('owner'),
  ownerController.updateItem
);

module.exports = router;
