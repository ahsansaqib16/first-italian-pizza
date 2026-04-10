const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAll = async (req, res) => {
  const { startDate, endDate, category } = req.query;
  const where = {};
  if (category) where.category = category;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate)   { const e = new Date(endDate); e.setHours(23,59,59,999); where.date.lte = e; }
  }
  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({ where, orderBy: { date: 'desc' } }),
    prisma.expense.aggregate({ where, _sum: { amount: true } }),
  ]);
  res.json({ expenses, totalAmount: total._sum.amount || 0 });
};

exports.create = async (req, res) => {
  try {
    const { title, amount, category, description, date } = req.body;
    const expense = await prisma.expense.create({
      data: {
        title, amount: Number(amount),
        category: category || 'General',
        description: description || '',
        date: date ? new Date(date) : new Date(),
      },
    });
    res.status(201).json(expense);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const { title, amount, category, description, date } = req.body;
    const expense = await prisma.expense.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(title       !== undefined && { title }),
        ...(amount      !== undefined && { amount: Number(amount) }),
        ...(category    !== undefined && { category }),
        ...(description !== undefined && { description }),
        ...(date        !== undefined && { date: new Date(date) }),
      },
    });
    res.json(expense);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    await prisma.expense.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

// Summary for finance dashboard
exports.summary = async (req, res) => {
  const { startDate, endDate } = req.query;
  const dateFilter = {};
  if (startDate) dateFilter.gte = new Date(startDate);
  if (endDate)   { const e = new Date(endDate); e.setHours(23,59,59,999); dateFilter.lte = e; }

  const expWhere = Object.keys(dateFilter).length ? { date: dateFilter } : {};
  const ordWhere = { status: { not: 'cancelled' }, ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}) };

  const [totalExpenses, totalRevenue, byCategory] = await Promise.all([
    prisma.expense.aggregate({ where: expWhere, _sum: { amount: true } }),
    prisma.order.aggregate({ where: ordWhere, _sum: { total: true } }),
    prisma.expense.groupBy({
      by: ['category'], where: expWhere,
      _sum: { amount: true }, orderBy: { _sum: { amount: 'desc' } },
    }),
  ]);

  const revenue  = totalRevenue._sum.total    || 0;
  const expenses = totalExpenses._sum.amount  || 0;

  res.json({
    totalRevenue:  revenue,
    totalExpenses: expenses,
    netProfit:     revenue - expenses,
    profitMargin:  revenue > 0 ? ((revenue - expenses) / revenue * 100).toFixed(1) : 0,
    byCategory:    byCategory.map(c => ({ category: c.category, amount: c._sum.amount || 0 })),
  });
};
