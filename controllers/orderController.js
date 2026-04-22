const { sequelize } = require("../config/db");
const { Order, OrderItem, Item } = require("../models");

exports.createOrder = async (req, res) => {
  try {
    const { items, canteen_id, payment_method } = req.body;

    const t = await sequelize.transaction();
    let total = 0;

    for (const it of items) {
      const dbItem = await Item.findByPk(it.item_id, { transaction: t });
      if (!dbItem || !dbItem.is_active) throw new Error(`Item unavailable`);
      if (dbItem.stock < it.quantity) throw new Error(`Insufficient stock`);

      total += Number(dbItem.price) * it.quantity;

      await dbItem.update(
        { stock: dbItem.stock - it.quantity },
        { transaction: t }
      );
    }

    const order = await Order.create(
      {
        user_id: req.user.id,
        canteen_id,
        payment_method,
        subtotal: total,
        tax: total * 0.05,
        total: total * 1.05,
        status: "pending"
      },
      { transaction: t }
    );

    for (const it of items) {
      const dbItem = await Item.findByPk(it.item_id, { transaction: t });
      await OrderItem.create(
        {
          order_id: order.id,
          item_id: dbItem.id,
          quantity: it.quantity,
          unit_price: dbItem.price
        },
        { transaction: t }
      );
    }
// controllers/orderController.js  (inside createOrder)
const io = req.app.get('io'); // inside express handler

// after successful create of order
io.to(`canteen-${order.canteen_id}`).emit('new-order', { orderId: order.id, order });
io.emit('order-created', { orderId: order.id }); // optional global event for admin

    await t.commit();
    return res.json({ orderId: order.id, status: "placed" });

  } catch (err) {
    if (t) await t.rollback();
    return res.status(400).json({ message: err.message });
  }
};

exports.listUserOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { user_id: req.user.id },
      include: [{ model: OrderItem, as: "order_items", include: ["item"] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(orders);
  } catch (err) {
    console.error("listUserOrders", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const id = req.params.id;

    const order = await Order.findByPk(id, {
      include: [{ model: OrderItem, as: "order_items", include: ["item"] }]
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (
      req.user.role !== "admin" &&
      req.user.role !== "staff" &&
      req.user.id !== order.user_id
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(order);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};
