// controllers/ownerController.js
const { Item, Canteen, Order, OrderItem } = require("../models");

// ================= OWNER: View Orders =================
exports.listOrdersForOwner = async (req, res) => {
  try {
    const ownerId = req.user.id;

    const canteens = await Canteen.findAll({
      where: { owner_id: ownerId }
    });

    if (!canteens.length) {
      return res.json([]);
    }

    const canteenIds = canteens.map(c => c.id);

    const orders = await Order.findAll({
      where: { canteen_id: canteenIds },
      include: [{ model: OrderItem, as: "order_items" }]
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
    const ownerId = req.user.id;
    const { name, price, description, canteenId } = req.body;

    const canteen = await Canteen.findByPk(canteenId);
    if (!canteen) return res.status(404).json({ message: "Canteen not found" });

    if (canteen.owner_id !== ownerId)
      return res.status(403).json({ message: "Not your canteen" });

    const item = await Item.create({
      name,
      price,
      description,
      canteen_id: canteenId
    });

    res.json({ message: "Item created", item });

  } catch (err) {
    console.error("addItem ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= OWNER: Update Item =================
exports.updateItem = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const itemId = req.params.id;

    const { name, price, description, available } = req.body;

    const item = await Item.findByPk(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    const canteen = await Canteen.findByPk(item.canteen_id);
    if (!canteen || canteen.owner_id !== ownerId)
      return res.status(403).json({ message: "Not allowed" });

    await item.update({ name, price, description, available });

    res.json({ message: "Item updated", item });

  } catch (err) {
    console.error("updateItem ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
