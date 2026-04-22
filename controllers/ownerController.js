// controllers/ownerController.js
const { Item, Order, OrderItem } = require("../models");

// ================= OWNER: View Orders =================
exports.listOrdersForOwner = async (req, res) => {
  try {
    const canteenId = req.user.canteen_id;
    if (!canteenId) return res.json([]);

    const orders = await Order.findAll({
      where: { canteen_id: canteenId },
      include: [{ model: OrderItem, as: "order_items", include: ["item"] }],
      order: [['createdAt', 'DESC']]
    });

    res.json(orders);
  } catch (err) {
    console.error("listOrdersForOwner ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= OWNER: Add Item =================
exports.addItem = async (req, res) => {
  try {
    const canteenId = req.user.canteen_id;
    const { name, price } = req.body;

    if (!canteenId) return res.status(403).json({ message: "No canteen assigned to this owner" });

    const item = await Item.create({
      name,
      price,
      canteen_id: canteenId,
      is_active: true,
      stock: 100 // default stock
    });

    res.json({ message: "Item added successfully", item });
  } catch (err) {
    console.error("addItem ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= OWNER: Update Item =================
exports.updateItem = async (req, res) => {
  try {
    const canteenId = req.user.canteen_id;
    const itemId = req.params.id;
    const { name, price, is_active, stock } = req.body;

    const item = await Item.findOne({ where: { id: itemId, canteen_id: canteenId } });
    if (!item) return res.status(404).json({ message: "Item not found in your canteen" });

    await item.update({ name, price, is_active, stock });
    res.json({ message: "Item updated", item });
  } catch (err) {
    console.error("updateItem ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const canteenId = req.user.canteen_id;

    const order = await Order.findOne({ where: { id, canteen_id: canteenId } });
    if (!order) return res.status(404).json({ message: "Order not found" });

    await order.update({ status });

    // Emit Real-time Update
    const io = req.app.get('io');
    io.emit(`order-status-${order.user_id}`, { orderId: order.id, status });
    io.emit('admin-activity', { message: `Order #${order.id} updated to ${status}` });

    res.json({ message: "Status updated", order });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.toggleItem = async (req, res) => {
  try {
    const { id } = req.params;
    const canteenId = req.user.canteen_id;
    const item = await Item.findOne({ where: { id, canteen_id: canteenId } });
    if (!item) return res.status(404).json({ message: "Item not found" });

    await item.update({ is_active: !item.is_active });
    res.json({ message: "Status toggled", item });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const canteenId = req.user.canteen_id;
    const item = await Item.findOne({ where: { id, canteen_id: canteenId } });
    if (!item) return res.status(404).json({ message: "Item not found" });

    await item.destroy();
    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
