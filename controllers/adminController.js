// controllers/adminController.js
const bcrypt = require('bcrypt');
const { Canteen, User, Item, Order, OrderItem } = require('../models');

exports.createCanteen = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Canteen name required' });

    const canteen = await Canteen.create({ name, description });
    res.json({ message: 'Canteen created', canteen });
  } catch (err) {
    console.error('createCanteen', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const users = await User.findAll({ attributes: ['id','name','email','role','createdAt'] });
    res.json(users);
  } catch (err) {
    console.error('listUsers', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.listOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [{ model: OrderItem, as: 'order_items' }]
    });
    res.json(orders);
  } catch (err) {
    console.error('listOrders', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// create a canteen owner user and assign to a canteen
exports.createOwner = async (req, res) => {
  try {
    const { canteenId, ownerName } = req.body;
    if (!canteenId || !ownerName) return res.status(400).json({ message: 'canteenId and ownerName required' });

    const canteen = await Canteen.findByPk(canteenId);
    if (!canteen) return res.status(404).json({ message: 'Canteen not found' });

    // construct owner email and password
    // format: owner_canteen{canteenId}@gmail.com (you requested)
    const email = `owner_canteen${canteenId}@gmail.com`;
    const password = `canteen${canteenId}`; // default password (owner knows or admin communicates)

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Owner already exists for this canteen' });

    const hash = await bcrypt.hash(password, 10);
    const owner = await User.create({
      name: ownerName,
      email,
      password_hash: hash,
      role: 'owner',
      canteen_id: Number(canteenId)
    });

    res.json({ message: 'Owner created', owner: { id: owner.id, email, password } });
  } catch (err) {
    console.error('createOwner', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.exportData = async (req, res) => {
    try {
        const { type } = req.query; // 'users' or 'orders'
        let data, filename, headers;

        if (type === 'users') {
            data = await User.findAll({ raw: true });
            filename = 'users_export.csv';
            headers = 'ID,Name,Email,Role,Joined\n';
            data = data.map(u => `${u.id},${u.name},${u.email},${u.role},${u.createdAt}`).join('\n');
        } else {
            data = await Order.findAll({ raw: true });
            filename = 'orders_export.csv';
            headers = 'ID,UserID,CanteenID,Total,Status,Date\n';
            data = data.map(o => `${o.id},${o.user_id},${o.canteen_id},${o.total},${o.status},${o.createdAt}`).join('\n');
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.status(200).send(headers + data);
    } catch (err) {
        console.error('export error', err);
        res.status(500).send('Export failed');
    }
};
