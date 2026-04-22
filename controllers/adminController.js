// controllers/adminController.js
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { Canteen, User, Item, Order, OrderItem } = require('../models');

const csvEscape = (value) => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const auditLog = (req, type, message, meta = {}) => {
  const logger = req.app.get('logEvent');
  if (typeof logger === 'function') {
    logger(type, message, meta);
  }
};

exports.createCanteen = async (req, res) => {
  try {
    const { name, description, location } = req.body;
    if (!name) return res.status(400).json({ message: 'Canteen name required' });

    const canteen = await Canteen.create({ name, description, location, is_active: true });
    auditLog(req, 'canteen.created', `Canteen created: ${canteen.name}`, { canteenId: canteen.id });
    res.json({ message: 'Canteen created', canteen });
  } catch (err) {
    console.error('createCanteen', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.listCanteens = async (req, res) => {
  try {
    const canteens = await Canteen.findAll({
      include: [{ model: Item }],
      order: [['id', 'ASC']]
    });
    res.json(canteens);
  } catch (err) {
    console.error('listCanteens', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateCanteen = async (req, res) => {
  try {
    const canteen = await Canteen.findByPk(req.params.id);
    if (!canteen) return res.status(404).json({ message: 'Canteen not found' });

    await canteen.update({
      name: req.body.name ?? canteen.name,
      description: req.body.description ?? canteen.description,
      location: req.body.location ?? canteen.location,
      is_active: typeof req.body.is_active === 'boolean' ? req.body.is_active : canteen.is_active
    });

    auditLog(req, 'canteen.updated', `Canteen updated: ${canteen.name}`, { canteenId: canteen.id });
    res.json({ message: 'Canteen updated', canteen });
  } catch (err) {
    console.error('updateCanteen', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteCanteen = async (req, res) => {
  try {
    const canteen = await Canteen.findByPk(req.params.id);
    if (!canteen) return res.status(404).json({ message: 'Canteen not found' });

    await canteen.destroy();
    auditLog(req, 'canteen.deleted', `Canteen deleted: ${canteen.name}`, { canteenId: canteen.id });
    res.json({ message: 'Canteen deleted' });
  } catch (err) {
    console.error('deleteCanteen', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'canteen_id', 'email_verified', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (err) {
    console.error('listUsers', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const role = req.body.role;
    if (!['user', 'admin', 'owner'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    await user.update({ role });
    auditLog(req, 'user.role.updated', `Role updated for ${user.email}`, { userId: user.id, role });
    res.json({ message: 'Role updated', user: { id: user.id, role } });
  } catch (err) {
    console.error('updateUserRole', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin users' });
    }

    await user.destroy();
    auditLog(req, 'user.deleted', `User deleted: ${user.email}`, { userId: user.id });
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('deleteUser', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.listOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [{ model: OrderItem, as: 'order_items', include: ['item'] }, { model: Canteen }],
      order: [['createdAt', 'DESC']]
    });
    res.json(orders);
  } catch (err) {
    console.error('listOrders', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.dashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalOrders, revenueRows, orders] = await Promise.all([
      User.count(),
      Order.count(),
      Order.findAll({ attributes: ['canteen_id', 'total'], raw: true }),
      Order.findAll({ attributes: ['id', 'createdAt', 'total'], raw: true, order: [['createdAt', 'DESC']] })
    ]);

    const revenue = revenueRows.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const byDayMap = new Map();

    orders.forEach((order) => {
      const key = new Date(order.createdAt).toISOString().slice(0, 10);
      byDayMap.set(key, (byDayMap.get(key) || 0) + 1);
    });

    const ordersPerDay = Array.from(byDayMap.entries()).slice(-7).map(([date, count]) => ({ date, count }));

    res.json({
      totalUsers,
      totalOrders,
      revenue: Number(revenue.toFixed(2)),
      ordersPerDay
    });
  } catch (err) {
    console.error('dashboardStats', err);
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
      canteen_id: Number(canteenId),
      email_verified: true
    });

    auditLog(req, 'owner.created', `Owner created for canteen ${canteenId}`, { ownerId: owner.id, canteenId: Number(canteenId) });
    res.json({ message: 'Owner created', owner: { id: owner.id, email, password } });
  } catch (err) {
    console.error('createOwner', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.exportData = async (req, res) => {
  try {
    const { type } = req.query;

    if (type === 'orders') {
      const orders = await Order.findAll({ raw: true, order: [['createdAt', 'DESC']] });
      const rows = orders.map((order) => [
        csvEscape(order.id),
        csvEscape(order.user_id),
        csvEscape(order.canteen_id),
        csvEscape(order.subtotal),
        csvEscape(order.tax),
        csvEscape(order.total),
        csvEscape(order.status),
        csvEscape(order.payment_method),
        csvEscape(order.createdAt)
      ].join(','));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=orders_export.csv');
      return res.status(200).send(['ID,UserID,CanteenID,Subtotal,Tax,Total,Status,PaymentMethod,Date', ...rows].join('\n'));
    }

    const users = await User.findAll({ raw: true, order: [['createdAt', 'DESC']] });
    const rows = users.map((user) => [
      csvEscape(user.id),
      csvEscape(user.name),
      csvEscape(user.email),
      csvEscape(user.role),
      csvEscape(user.canteen_id),
      csvEscape(user.email_verified),
      csvEscape(user.createdAt)
    ].join(','));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users_export.csv');
    return res.status(200).send(['ID,Name,Email,Role,CanteenID,EmailVerified,Joined', ...rows].join('\n'));
  } catch (err) {
    console.error('export error', err);
    res.status(500).send('Export failed');
  }
};

exports.listLogs = async (req, res) => {
  try {
    const logs = req.app.get('systemLogs') || [];
    res.json(logs.slice(-100).reverse());
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
