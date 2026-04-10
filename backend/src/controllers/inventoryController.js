const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAll = async (req, res) => {
  const { lowStock } = req.query;
  let ingredients = await prisma.ingredient.findMany({ orderBy: { name: 'asc' } });
  if (lowStock === 'true') ingredients = ingredients.filter(i => i.quantity <= i.minStock);
  res.json(ingredients);
};

exports.getById = async (req, res) => {
  const item = await prisma.ingredient.findUnique({ where: { id: Number(req.params.id) } });
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.json(item);
};

exports.create = async (req, res) => {
  try {
    const { name, unit, quantity, minStock, cost } = req.body;
    const item = await prisma.ingredient.create({
      data: { name, unit: unit || 'pcs', quantity: Number(quantity||0), minStock: Number(minStock||5), cost: Number(cost||0) },
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, unit, quantity, minStock, cost } = req.body;
    const item = await prisma.ingredient.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(name     !== undefined && { name }),
        ...(unit     !== undefined && { unit }),
        ...(quantity !== undefined && { quantity: Number(quantity) }),
        ...(minStock !== undefined && { minStock: Number(minStock) }),
        ...(cost     !== undefined && { cost: Number(cost) }),
      },
    });
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.restock = async (req, res) => {
  try {
    const { amount } = req.body;
    const item = await prisma.ingredient.update({
      where: { id: Number(req.params.id) },
      data: { quantity: { increment: Number(amount) } },
    });
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await prisma.ingredient.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
