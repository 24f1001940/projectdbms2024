const { Canteen, Item } = require("../models");

exports.listItems = async (req, res) => {
  try {
    const items = await Item.findAll({ where: { is_active: true } });
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: "Error loading items" });
  }
};

exports.listCanteens = async (req, res) => {
  try {
    const data = await Canteen.findAll();
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: "Error loading canteens" });
  }
};

exports.menuByCanteen = async (req, res) => {
  try {
    const id = req.params.id;
    const items = await Item.findAll({ where: { canteen_id: id, is_active: true } });
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: "Error loading menu" });
  }
};
