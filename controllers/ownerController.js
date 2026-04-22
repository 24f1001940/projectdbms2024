// controllers/ownerController.js
const { Item, Order, OrderItem, Canteen } = require('../models');

const auditLog = (req, type, message, meta = {}) => {
  const logger = req.app.get('logEvent');
  if (typeof logger === 'function') {
    logger(type, message, meta);
  }
};

// ================= OWNER: View Orders =================
exports.listOrdersForOwner = async (req, res) => {
  try {
    const canteenId = req.user.canteen_id;
    if (!canteenId) return res.json([]);

    const orders = await Order.findAll({
      where: { canteen_id: canteenId },
      include: [{ model: OrderItem, as: 'order_items', include: ['item'] }, { model: Canteen }],
      order: [['createdAt', 'DESC']]
    });

    res.json(orders);
  } catch (err) {
    console.error('listOrdersForOwner ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.dashboardStats = async (req, res) => {
  try {
    const canteenId = req.user.canteen_id;
    if (!canteenId) return res.json({ revenue: 0, orders: 0, popularItems: [] });

    const orders = await Order.findAll({ where: { canteen_id: canteenId }, include: [{ model: OrderItem, as: 'order_items' }] });
    const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const itemCounts = new Map();

    orders.forEach((order) => {
      (order.order_items || []).forEach((entry) => {
        itemCounts.set(entry.item_id, (itemCounts.get(entry.item_id) || 0) + Number(entry.quantity || 0));
      });
    });

    const popularItems = await Item.findAll({
      where: { id: Array.from(itemCounts.keys()) },
      raw: true
    });

    const popular = popularItems
      .map((item) => ({ name: item.name, quantity: itemCounts.get(item.id) || 0 }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    res.json({ revenue: Number(revenue.toFixed(2)), orders: orders.length, popularItems: popular });
  } catch (err) {
    console.error('owner dashboardStats ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ================= OWNER: Add Item =================
exports.addItem = async (req, res) => {
  try {
    const canteenId = req.user.canteen_id;
    const { name, price, category, description, stock, image_path } = req.body;

    if (!canteenId) return res.status(403).json({ message: 'No canteen assigned to this owner' });

    const item = await Item.create({
      name,
      price,
      category: category || 'meals',
      description,
      image_path,
      canteen_id: canteenId,
      is_active: true,
      stock: stock ?? 100
    });

    auditLog(req, 'item.created', `Item added: ${item.name}`, { itemId: item.id, canteenId });
    res.json({ message: 'Item added successfully', item });
  } catch (err) {
    console.error('addItem ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ================= OWNER: Update Item =================
exports.updateItem = async (req, res) => {
  try {
    const canteenId = req.user.canteen_id;
    const itemId = req.params.id;
    const { name, price, is_active, stock, category, description, image_path } = req.body;

    const item = await Item.findOne({ where: { id: itemId, canteen_id: canteenId } });
    if (!item) return res.status(404).json({ message: 'Item not found in your canteen' });

    await item.update({
      name: name ?? item.name,
      price: price ?? item.price,
      is_active: typeof is_active === 'boolean' ? is_active : item.is_active,
      stock: stock ?? item.stock,
      category: category ?? item.category,
      description: description ?? item.description,
      image_path: image_path ?? item.image_path
    });
    auditLog(req, 'item.updated', `Item updated: ${item.name}`, { itemId: item.id, canteenId });
    res.json({ message: 'Item updated', item });
  } catch (err) {
    console.error('updateItem ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const canteenId = req.user.canteen_id;

    const order = await Order.findOne({ where: { id, canteen_id: canteenId } });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (!['pending', 'preparing', 'ready', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    await order.update({ status });

    const io = req.app.get('io');
    if (io) {
      io.emit(`order-status-${order.user_id}`, { orderId: order.id, status });
      io.emit('admin-activity', { message: `Order #${order.id} updated to ${status}` });
      io.to(`user-${order.user_id}`).emit('order-status-updated', { orderId: order.id, status });
    }

    auditLog(req, 'order.status.updated', `Order #${order.id} updated to ${status}`, { orderId: order.id, canteenId });

    res.json({ message: 'Status updated', order });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleItem = async (req, res) => {
  try {
    const { id } = req.params;
    const canteenId = req.user.canteen_id;
    const item = await Item.findOne({ where: { id, canteen_id: canteenId } });
    if (!item) return res.status(404).json({ message: 'Item not found' });

    await item.update({ is_active: !item.is_active });
    auditLog(req, 'item.toggled', `Item toggled: ${item.name}`, { itemId: item.id, canteenId });
    res.json({ message: 'Status toggled', item });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const canteenId = req.user.canteen_id;
    const item = await Item.findOne({ where: { id, canteen_id: canteenId } });
    if (!item) return res.status(404).json({ message: 'Item not found' });

    await item.destroy();
    auditLog(req, 'item.deleted', `Item deleted: ${item.name}`, { itemId: item.id, canteenId });
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
