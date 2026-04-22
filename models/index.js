const User = require('./user');
const Canteen = require('./canteen');
const Item = require('./item');
const Order = require('./order');
const OrderItem = require('./orderItem');

// Item ↔ Canteen
Item.belongsTo(Canteen, { foreignKey: 'canteen_id' });
Canteen.hasMany(Item, { foreignKey: 'canteen_id' });

// Order ↔ User
Order.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Order, { foreignKey: 'user_id' });

// User ↔ Canteen
User.belongsTo(Canteen, { foreignKey: 'canteen_id' });
Canteen.hasMany(User, { foreignKey: 'canteen_id' });

// Order ↔ Canteen
Order.belongsTo(Canteen, { foreignKey: 'canteen_id' });

// Order ↔ OrderItem
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'order_items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

// OrderItem ↔ Item
OrderItem.belongsTo(Item, { as: 'item', foreignKey: 'item_id' });

const { sequelize } = require('../config/db');

module.exports = {
  sequelize,
  User,
  Canteen,
  Item,
  Order,
  OrderItem
};
