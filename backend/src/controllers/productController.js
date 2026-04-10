const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAll = async (req, res) => {
  const { categoryId, search, active } = req.query;
  const where = {};
  if (categoryId) where.categoryId = Number(categoryId);
  if (active !== undefined) where.isActive = active === 'true';
  if (search) where.name = { contains: search };
  const products = await prisma.product.findMany({
    where,
    include: { category: true, ingredients: { include: { ingredient: true } } },
    orderBy: { name: 'asc' },
  });
  res.json(products);
};

exports.getById = async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: Number(req.params.id) },
    include: { category: true, ingredients: { include: { ingredient: true } } },
  });
  if (!product) return res.status(404).json({ message: 'Not found' });
  res.json(product);
};

exports.create = async (req, res) => {
  try {
    const { name, description, price, cost, categoryId, barcode, ingredients } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : '';
    const product = await prisma.product.create({
      data: {
        name, description: description || '', price: Number(price),
        cost: Number(cost || 0), categoryId: Number(categoryId),
        barcode: barcode || '', image,
        ...(ingredients?.length && {
          ingredients: {
            create: ingredients.map(i => ({ ingredientId: Number(i.ingredientId), quantity: Number(i.quantity) }))
          }
        })
      },
      include: { category: true },
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, description, price, cost, categoryId, barcode, isActive, ingredients } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : undefined;
    // Update ingredients: delete old, create new
    if (ingredients !== undefined) {
      await prisma.productIngredient.deleteMany({ where: { productId: Number(req.params.id) } });
    }
    const product = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: Number(price) }),
        ...(cost !== undefined && { cost: Number(cost) }),
        ...(categoryId && { categoryId: Number(categoryId) }),
        ...(barcode !== undefined && { barcode }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(image && { image }),
        ...(ingredients?.length && {
          ingredients: {
            create: ingredients.map(i => ({ ingredientId: Number(i.ingredientId), quantity: Number(i.quantity) }))
          }
        })
      },
      include: { category: true, ingredients: { include: { ingredient: true } } },
    });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
