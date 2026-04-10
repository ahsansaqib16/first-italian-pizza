const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Generate order number: ORD-YYYYMMDD-XXXX
const genOrderNumber = () => {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${date}-${rand}`;
};

exports.getAll = async (req, res) => {
  const { status, type, date, page = 1, limit = 50 } = req.query;
  const where = {};
  if (status) where.status = status;
  if (type)   where.type   = type;
  if (date) {
    const start = new Date(date); start.setHours(0,0,0,0);
    const end   = new Date(date); end.setHours(23,59,59,999);
    where.createdAt = { gte: start, lte: end };
  }
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where, orderBy: { createdAt: 'desc' },
      skip: (page-1) * limit, take: Number(limit),
      include: { items: true, user: { select: { name: true } } },
    }),
    prisma.order.count({ where }),
  ]);
  res.json({ orders, total, page: Number(page), pages: Math.ceil(total / limit) });
};

exports.getById = async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: Number(req.params.id) },
    include: { items: true, user: { select: { name: true } }, payment: true },
  });
  if (!order) return res.status(404).json({ message: 'Not found' });
  res.json(order);
};

exports.create = async (req, res) => {
  try {
    const {
      type, items, discount, discountType, taxRate,
      paymentMethod, amountPaid, customerName, customerPhone,
      customerAddress, tableNumber, notes
    } = req.body;

    if (!items?.length) return res.status(400).json({ message: 'No items in order' });

    // Fetch products to get current prices
    const productIds = items.map(i => i.productId);
    const products   = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const productMap = Object.fromEntries(products.map(p => [p.id, p]));

    const orderItems = items.map(i => {
      const p = productMap[i.productId];
      if (!p) throw new Error(`Product ${i.productId} not found`);
      return { productId: p.id, name: p.name, price: p.price, quantity: i.quantity, subtotal: p.price * i.quantity };
    });

    const subtotal = orderItems.reduce((s, i) => s + i.subtotal, 0);
    const discAmt  = discountType === 'percent' ? subtotal * (Number(discount||0)/100) : Number(discount||0);
    const taxAmt   = (subtotal - discAmt) * (Number(taxRate||0)/100);
    const total    = subtotal - discAmt + taxAmt;
    const change   = Number(amountPaid||0) - total;

    const order = await prisma.order.create({
      data: {
        orderNumber: genOrderNumber(),
        type: type || 'dine-in',
        subtotal, discount: discAmt, discountType: discountType || 'fixed',
        tax: taxAmt, taxRate: Number(taxRate||0),
        total, paymentMethod: paymentMethod || 'cash',
        amountPaid: Number(amountPaid||total), change: Math.max(0, change),
        customerName: customerName || '', customerPhone: customerPhone || '',
        customerAddress: customerAddress || '',
        tableNumber: tableNumber || '', notes: notes || '',
        userId: req.user.id,
        status: 'completed',
        items: { create: orderItems },
        payment: {
          create: {
            method: paymentMethod || 'cash', amount: total,
            amountPaid: Number(amountPaid||total), change: Math.max(0, change),
          }
        }
      },
      include: { items: true, payment: true, user: { select: { name: true } } },
    });

    // Deduct inventory for each item
    for (const item of orderItems) {
      const ingredients = await prisma.productIngredient.findMany({
        where: { productId: item.productId }, include: { ingredient: true }
      });
      for (const pi of ingredients) {
        await prisma.ingredient.update({
          where: { id: pi.ingredientId },
          data: { quantity: { decrement: pi.quantity * item.quantity } },
        });
      }
    }

    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const order = await prisma.order.update({
      where: { id: Number(req.params.id) },
      data: { status: req.body.status },
    });
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.cancel = async (req, res) => {
  try {
    const order = await prisma.order.update({
      where: { id: Number(req.params.id) },
      data: { status: 'cancelled' },
    });
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
