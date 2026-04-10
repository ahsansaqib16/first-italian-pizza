const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper: date range
const dayRange = (dateStr) => {
  const start = new Date(dateStr); start.setHours(0,0,0,0);
  const end   = new Date(dateStr); end.setHours(23,59,59,999);
  return { gte: start, lte: end };
};

const monthRange = (year, month) => {
  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month, 0, 23, 59, 59, 999);
  return { gte: start, lte: end };
};

// Daily sales summary
exports.daily = async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const where = { createdAt: dayRange(date), status: { not: 'cancelled' } };

  const [orders, totalRevenue, totalOrders] = await Promise.all([
    prisma.order.findMany({ where, include: { items: true }, orderBy: { createdAt: 'desc' } }),
    prisma.order.aggregate({ where, _sum: { total: true } }),
    prisma.order.count({ where }),
  ]);

  const totalCost = orders.reduce((sum, o) => {
    return sum + o.items.reduce((s, i) => s + (i.price * 0.4 * i.quantity), 0); // estimate
  }, 0);

  res.json({
    date,
    totalOrders,
    totalRevenue: totalRevenue._sum.total || 0,
    estimatedProfit: (totalRevenue._sum.total || 0) - totalCost,
    orders,
  });
};

// Monthly sales summary
exports.monthly = async (req, res) => {
  const year  = Number(req.query.year  || new Date().getFullYear());
  const month = Number(req.query.month || new Date().getMonth() + 1);
  const where = { createdAt: monthRange(year, month), status: { not: 'cancelled' } };

  const [totalRevenue, totalOrders] = await Promise.all([
    prisma.order.aggregate({ where, _sum: { total: true } }),
    prisma.order.count({ where }),
  ]);

  // Daily breakdown
  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyBreakdown = await Promise.all(
    Array.from({ length: daysInMonth }, (_, i) => {
      const d = `${year}-${String(month).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`;
      const dayWhere = { createdAt: dayRange(d), status: { not: 'cancelled' } };
      return prisma.order.aggregate({ where: dayWhere, _sum: { total: true } })
        .then(r => ({ date: d, revenue: r._sum.total || 0 }));
    })
  );

  res.json({ year, month, totalOrders, totalRevenue: totalRevenue._sum.total || 0, dailyBreakdown });
};

// Top products
exports.topProducts = async (req, res) => {
  const { startDate, endDate, limit = 10 } = req.query;
  const where = {};
  if (startDate || endDate) {
    where.order = { createdAt: {} };
    if (startDate) where.order.createdAt.gte = new Date(startDate);
    if (endDate)   where.order.createdAt.lte = new Date(endDate);
    where.order.status = { not: 'cancelled' };
  }

  const items = await prisma.orderItem.groupBy({
    by: ['productId', 'name'],
    _sum:   { quantity: true, subtotal: true },
    _count: { id: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: Number(limit),
  });

  res.json(items.map(i => ({
    productId: i.productId,
    name:      i.name,
    totalSold: i._sum.quantity || 0,
    revenue:   i._sum.subtotal || 0,
    orders:    i._count.id,
  })));
};

// Sales by category
exports.byCategory = async (req, res) => {
  const { startDate, endDate } = req.query;
  const orderWhere = { status: { not: 'cancelled' } };
  if (startDate) orderWhere.createdAt = { ...(orderWhere.createdAt||{}), gte: new Date(startDate) };
  if (endDate)   orderWhere.createdAt = { ...(orderWhere.createdAt||{}), lte: new Date(endDate) };

  const orders = await prisma.order.findMany({
    where: orderWhere,
    include: { items: { include: { product: { include: { category: true } } } } },
  });

  const catMap = {};
  for (const o of orders) {
    for (const item of o.items) {
      const catName = item.product?.category?.name || 'Unknown';
      if (!catMap[catName]) catMap[catName] = { name: catName, revenue: 0, itemsSold: 0 };
      catMap[catName].revenue   += item.subtotal;
      catMap[catName].itemsSold += item.quantity;
    }
  }
  res.json(Object.values(catMap).sort((a,b) => b.revenue - a.revenue));
};

// Summary stats for dashboard
exports.summary = async (_req, res) => {
  const today     = new Date().toISOString().split('T')[0];
  const todayWhere = { createdAt: dayRange(today), status: { not: 'cancelled' } };
  const allWhere   = { status: { not: 'cancelled' } };

  const [todaySales, todayOrders, totalSales, totalOrders, allIngredients] = await Promise.all([
    prisma.order.aggregate({ where: todayWhere, _sum: { total: true } }),
    prisma.order.count({ where: todayWhere }),
    prisma.order.aggregate({ where: allWhere,   _sum: { total: true } }),
    prisma.order.count({ where: allWhere }),
    prisma.ingredient.findMany({ select: { quantity: true, minStock: true } }),
  ]);

  const lowStockCount = allIngredients.filter(i => i.quantity <= i.minStock).length;

  res.json({
    todayRevenue:  todaySales._sum.total || 0,
    todayOrders,
    totalRevenue:  totalSales._sum.total || 0,
    totalOrders,
    lowStockCount,
  });
};
