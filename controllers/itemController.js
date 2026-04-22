const { Op } = require('sequelize');
const { Canteen, Item } = require('../models');

exports.listItems = async (req, res) => {
  try {
    const { q, canteen_id, category, page = 1, limit = 100 } = req.query;
    const where = { is_active: true };

    if (canteen_id && canteen_id !== 'all') where.canteen_id = Number(canteen_id);
    if (category && category !== 'all') where.category = category;
    if (q) where.name = { [Op.like]: `%${String(q).trim()}%` };

    const items = await Item.findAll({
      where,
      include: [{ model: Canteen }],
      order: [['createdAt', 'DESC']],
      limit: Math.min(Number(limit) || 100, 200),
      offset: (Math.max(Number(page) || 1, 1) - 1) * Math.min(Number(limit) || 100, 200)
    });

    res.json(items);
  } catch (e) {
    res.status(500).json({ message: "Error loading items" });
  }
};

exports.listCanteens = async (req, res) => {
  try {
    const data = await Canteen.findAll({
      where: { is_active: true },
      include: [{ model: Item, where: { is_active: true }, required: false }],
      order: [['id', 'ASC']]
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: "Error loading canteens" });
  }
};

exports.menuByCanteen = async (req, res) => {
  try {
    const id = req.params.id;
    const items = await Item.findAll({ where: { canteen_id: id, is_active: true }, order: [['category', 'ASC'], ['name', 'ASC']] });
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: "Error loading menu" });
  }
};
