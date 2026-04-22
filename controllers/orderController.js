const { sequelize } = require('../config/db');
const { Order, OrderItem, Item, Canteen, User } = require('../models');
const PDFDocument = require('pdfkit');

function canAccessInvoice(req, order) {
  if (req.user.role === 'admin') {
    return true;
  }

  if (req.user.role === 'owner') {
    return req.user.canteen_id === order.canteen_id;
  }

  return req.user.id === order.user_id;
}

async function loadInvoice(orderId, req) {
  const order = await Order.findByPk(orderId, {
    include: [
      { model: OrderItem, as: 'order_items', include: ['item'] },
      { model: Canteen },
      { model: User, attributes: ['id', 'name', 'email'] }
    ]
  });

  if (!order) {
    return { error: { status: 404, message: 'Order not found' } };
  }

  if (!canAccessInvoice(req, order)) {
    return { error: { status: 403, message: 'Forbidden' } };
  }

  const items = order.order_items.map((entry) => ({
    name: entry.item ? entry.item.name : `Item #${entry.item_id}`,
    quantity: entry.quantity,
    unit_price: Number(entry.unit_price),
    line_total: Number(entry.quantity) * Number(entry.unit_price)
  }));

  return {
    order,
    invoiceNumber: `INV-${String(order.id).padStart(6, '0')}`,
    items,
    subtotal: Number(order.subtotal),
    tax: Number(order.tax),
    total: Number(order.total)
  };
}

function writeInvoicePdf(doc, invoice) {
  const formatMoney = (value) => `₹${Number(value).toFixed(2)}`;
  const pageLeft = 50;
  const tableWidth = 500;
  const columnWidths = [255, 55, 95, 95];

  const drawHeader = () => {
    doc.fillColor('#111827').fontSize(20).font('Helvetica-Bold').text('Jamia Canteen', pageLeft, 50, { align: 'center', width: tableWidth });
    doc.fillColor('#4b5563').fontSize(11).font('Helvetica').text('Official Tax Invoice', { align: 'center', width: tableWidth });
    doc.moveDown(1.2);
  };

  const drawSectionTitle = (title) => {
    doc.moveDown(0.6);
    doc.fillColor('#111827').fontSize(12).font('Helvetica-Bold').text(title, { underline: true });
    doc.moveDown(0.3);
  };

  const drawTableHeader = (y) => {
    doc.fillColor('#f3f4f6').rect(pageLeft, y - 4, tableWidth, 24).fill();
    doc.fillColor('#111827').fontSize(10).font('Helvetica-Bold');
    doc.text('Item', pageLeft + 8, y, { width: columnWidths[0] - 10 });
    doc.text('Qty', pageLeft + columnWidths[0], y, { width: columnWidths[1], align: 'right' });
    doc.text('Unit Price', pageLeft + columnWidths[0] + columnWidths[1], y, { width: columnWidths[2], align: 'right' });
    doc.text('Total', pageLeft + columnWidths[0] + columnWidths[1] + columnWidths[2], y, { width: columnWidths[3] - 8, align: 'right' });
    doc.moveTo(pageLeft, y + 18).lineTo(pageLeft + tableWidth, y + 18).stroke('#d1d5db');
    return y + 24;
  };

  drawHeader();

  doc.fillColor('#111827').fontSize(11).font('Helvetica');
  doc.text(`Invoice Number: ${invoice.invoiceNumber}`);
  doc.text(`Order ID: #${invoice.order.id}`);
  doc.text(`Date: ${new Date(invoice.order.createdAt).toLocaleString()}`);
  doc.text(`Status: ${String(invoice.order.status || 'pending').toUpperCase()}`);

  doc.moveDown(0.8);
  doc.font('Helvetica-Bold').text('Customer & Canteen Details');
  doc.font('Helvetica').text(`Customer: ${invoice.order.User ? invoice.order.User.name : 'Guest'}`);
  doc.text(`Email: ${invoice.order.User ? invoice.order.User.email : 'N/A'}`);
  doc.text(`Canteen: ${invoice.order.canteen ? invoice.order.canteen.name : 'N/A'}`);
  doc.text(`Payment Method: ${(invoice.order.payment_method || 'cash').toUpperCase()}`);

  drawSectionTitle('Items');

  let currentY = drawTableHeader(doc.y + 4);
  invoice.items.forEach((item, index) => {
    if (currentY > doc.page.height - 100) {
      doc.addPage();
      drawHeader();
      currentY = drawTableHeader(doc.y + 4);
    }

    doc.fillColor('#111827').fontSize(10).font('Helvetica');
    doc.text(`${index + 1}. ${item.name}`, pageLeft + 8, currentY, { width: columnWidths[0] - 10 });
    doc.text(String(item.quantity), pageLeft + columnWidths[0], currentY, { width: columnWidths[1], align: 'right' });
    doc.text(formatMoney(item.unit_price), pageLeft + columnWidths[0] + columnWidths[1], currentY, { width: columnWidths[2], align: 'right' });
    doc.text(formatMoney(item.line_total), pageLeft + columnWidths[0] + columnWidths[1] + columnWidths[2], currentY, { width: columnWidths[3] - 8, align: 'right' });
    currentY += 22;
  });

  if (currentY > doc.page.height - 150) {
    doc.addPage();
    drawHeader();
    currentY = doc.y;
  }

  doc.y = currentY + 8;
  doc.moveTo(pageLeft, doc.y).lineTo(pageLeft + tableWidth, doc.y).stroke('#d1d5db');

  doc.moveDown(0.8);
  doc.font('Helvetica').fontSize(11);
  doc.text(`Subtotal: ${formatMoney(invoice.subtotal)}`, { align: 'right' });
  doc.text(`Tax (5%): ${formatMoney(invoice.tax)}`, { align: 'right' });
  doc.moveDown(0.3);
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#b91c1c');
  doc.text(`Grand Total: ${formatMoney(invoice.total)}`, { align: 'right' });

  doc.moveDown(2);
  doc.fillColor('#6b7280').fontSize(9).font('Helvetica');
  doc.text('This invoice was generated electronically by Jamia Canteen Management System.', { align: 'center' });
}

exports.createOrder = async (req, res) => {
  let transaction;
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const canteenId = Number(req.body.canteen_id || req.body.canteenId);
    const paymentMethod = req.body.payment_method || 'cash';
    const note = req.body.note || null;

    if (!canteenId || items.length === 0) {
      return res.status(400).json({ message: 'canteen_id and items are required' });
    }

    transaction = await sequelize.transaction();
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const quantity = Number(item.quantity || 0);
      if (!item.item_id || quantity <= 0) {
        throw new Error('Invalid item payload');
      }

      const dbItem = await Item.findOne({ where: { id: item.item_id, canteen_id: canteenId }, transaction });
      if (!dbItem || !dbItem.is_active) {
        throw new Error('Item unavailable');
      }
      if (Number(dbItem.stock) < quantity) {
        throw new Error(`Insufficient stock for ${dbItem.name}`);
      }

      subtotal += Number(dbItem.price) * quantity;
      orderItems.push({ dbItem, quantity });

      await dbItem.update({ stock: dbItem.stock - quantity }, { transaction });
    }

    const tax = Number((subtotal * 0.05).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));

    const order = await Order.create(
      {
        user_id: req.user.id,
        canteen_id: canteenId,
        payment_method: paymentMethod,
        subtotal,
        tax,
        total,
        status: 'pending',
        note
      },
      { transaction }
    );

    for (const entry of orderItems) {
      await OrderItem.create(
        {
          order_id: order.id,
          item_id: entry.dbItem.id,
          quantity: entry.quantity,
          unit_price: entry.dbItem.price
        },
        { transaction }
      );
    }

    await transaction.commit();

    const io = req.app.get('io');
    const liveOrder = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: 'order_items', include: ['item'] }]
    });

    if (io && liveOrder) {
      io.to(`canteen-${canteenId}`).emit('new-order', { orderId: order.id, order: liveOrder });
      io.emit('order-created', { orderId: order.id, canteenId });
    }

    return res.status(201).json({
      orderId: order.id,
      status: 'placed',
      subtotal,
      tax,
      total,
      canteen_id: canteenId
    });

  } catch (err) {
    if (transaction) {
      await transaction.rollback();
    }
    return res.status(400).json({ message: err.message || 'Unable to place order' });
  }
};

exports.listUserOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { user_id: req.user.id },
      include: [
        { model: OrderItem, as: 'order_items', include: ['item'] },
        { model: Canteen }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(orders);
  } catch (err) {
    console.error('listUserOrders', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const id = req.params.id;

    const order = await Order.findByPk(id, {
      include: [{ model: OrderItem, as: 'order_items', include: ['item'] }, { model: Canteen }]
    });

    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (req.user.role === 'owner' && req.user.canteen_id !== order.canteen_id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'owner' && req.user.id !== order.user_id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(order);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getInvoice = async (req, res) => {
  try {
    const invoice = await loadInvoice(req.params.id, req);

    if (invoice.error) {
      return res.status(invoice.error.status).json({ message: invoice.error.message });
    }

    res.json({
      orderId: invoice.order.id,
      invoiceNumber: invoice.invoiceNumber,
      user: invoice.order.User ? { id: invoice.order.User.id, name: invoice.order.User.name, email: invoice.order.User.email } : null,
      canteen: invoice.order.canteen,
      items: invoice.items,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      total: invoice.total,
      payment_method: invoice.order.payment_method,
      status: invoice.order.status,
      createdAt: invoice.order.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getInvoicePdf = async (req, res) => {
  try {
    const invoice = await loadInvoice(req.params.id, req);

    if (invoice.error) {
      return res.status(invoice.error.status).json({ message: invoice.error.message });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);

    doc.pipe(res);
    writeInvoicePdf(doc, invoice);
    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
