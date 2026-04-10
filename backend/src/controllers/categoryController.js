const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAll = async (_req, res) => {
  const cats = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' }, include: { _count: { select: { products: true } } } });
  res.json(cats);
};

exports.create = async (req, res) => {
  try {
    const { name, icon, color, sortOrder } = req.body;
    const cat = await prisma.category.create({ data: { name, icon: icon || '🍕', color: color || '#ef4444', sortOrder: sortOrder || 0 } });
    res.status(201).json(cat);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const cat = await prisma.category.update({ where: { id: Number(req.params.id) }, data: req.body });
    res.json(cat);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
