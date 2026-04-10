const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAll = async (_req, res) => {
  const rows = await prisma.setting.findMany();
  // Convert array to key-value object
  const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
  res.json(settings);
};

exports.upsert = async (req, res) => {
  try {
    const updates = req.body; // { key: value, ... }
    const ops = Object.entries(updates).map(([key, value]) =>
      prisma.setting.upsert({
        where:  { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    );
    await Promise.all(ops);
    res.json({ message: 'Settings saved' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
