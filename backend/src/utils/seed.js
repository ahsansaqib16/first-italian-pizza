const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Users
  const adminPw = await bcrypt.hash('admin123', 10);
  const cashPw  = await bcrypt.hash('cashier123', 10);

  const admin = await prisma.user.upsert({
    where:  { email: 'admin@pizza.com' },
    update: {},
    create: { name: 'Admin', email: 'admin@pizza.com', password: adminPw, role: 'admin' },
  });

  await prisma.user.upsert({
    where:  { email: 'cashier@pizza.com' },
    update: {},
    create: { name: 'Cashier', email: 'cashier@pizza.com', password: cashPw, role: 'cashier' },
  });

  // Categories
  const cats = await Promise.all([
    prisma.category.upsert({ where: { name: 'Pizza'   }, update: {}, create: { name: 'Pizza',   icon: '🍕', color: '#ef4444', sortOrder: 1 } }),
    prisma.category.upsert({ where: { name: 'Burgers' }, update: {}, create: { name: 'Burgers', icon: '🍔', color: '#f97316', sortOrder: 2 } }),
    prisma.category.upsert({ where: { name: 'Drinks'  }, update: {}, create: { name: 'Drinks',  icon: '🥤', color: '#3b82f6', sortOrder: 3 } }),
    prisma.category.upsert({ where: { name: 'Sides'   }, update: {}, create: { name: 'Sides',   icon: '🍟', color: '#eab308', sortOrder: 4 } }),
    prisma.category.upsert({ where: { name: 'Desserts'}, update: {}, create: { name: 'Desserts',icon: '🍦', color: '#ec4899', sortOrder: 5 } }),
  ]);
  const [pizza, burgers, drinks, sides, desserts] = cats;

  // Ingredients
  const ingredients = await Promise.all([
    prisma.ingredient.upsert({ where: { name: 'Dough'         }, update: {}, create: { name: 'Dough',          unit: 'pcs', quantity: 100, minStock: 20, cost: 0.5 } }),
    prisma.ingredient.upsert({ where: { name: 'Tomato Sauce'  }, update: {}, create: { name: 'Tomato Sauce',   unit: 'L',   quantity: 10,  minStock: 2,  cost: 1.2 } }),
    prisma.ingredient.upsert({ where: { name: 'Mozzarella'    }, update: {}, create: { name: 'Mozzarella',     unit: 'kg',  quantity: 5,   minStock: 1,  cost: 8.0 } }),
    prisma.ingredient.upsert({ where: { name: 'Pepperoni'     }, update: {}, create: { name: 'Pepperoni',      unit: 'kg',  quantity: 3,   minStock: 0.5,cost: 12.0} }),
    prisma.ingredient.upsert({ where: { name: 'Burger Bun'    }, update: {}, create: { name: 'Burger Bun',     unit: 'pcs', quantity: 80,  minStock: 15, cost: 0.3 } }),
    prisma.ingredient.upsert({ where: { name: 'Beef Patty'    }, update: {}, create: { name: 'Beef Patty',     unit: 'pcs', quantity: 60,  minStock: 10, cost: 1.5 } }),
    prisma.ingredient.upsert({ where: { name: 'Cola Can'      }, update: {}, create: { name: 'Cola Can',       unit: 'pcs', quantity: 200, minStock: 30, cost: 0.4 } }),
    prisma.ingredient.upsert({ where: { name: 'French Fries'  }, update: {}, create: { name: 'French Fries',   unit: 'kg',  quantity: 10,  minStock: 2,  cost: 1.0 } }),
  ]);
  const [dough, sauce, mozz, pepperoni, bun, patty, cola, fries] = ingredients;

  // Products - Pizzas
  const margherita = await prisma.product.upsert({
    where:  { id: 1 },
    update: {},
    create: {
      name: 'Margherita', description: 'Classic tomato & mozzarella', price: 8.99, cost: 2.5,
      categoryId: pizza.id, barcode: '001',
      ingredients: { create: [
        { ingredientId: dough.id, quantity: 1 },
        { ingredientId: sauce.id, quantity: 0.1 },
        { ingredientId: mozz.id,  quantity: 0.15 },
      ]},
    },
  });

  await prisma.product.upsert({
    where: { id: 2 }, update: {},
    create: {
      name: 'Pepperoni Pizza', description: 'Loaded with spicy pepperoni', price: 11.99, cost: 3.5,
      categoryId: pizza.id, barcode: '002',
      ingredients: { create: [
        { ingredientId: dough.id,      quantity: 1 },
        { ingredientId: sauce.id,      quantity: 0.1 },
        { ingredientId: mozz.id,       quantity: 0.15 },
        { ingredientId: pepperoni.id,  quantity: 0.1 },
      ]},
    },
  });

  await prisma.product.upsert({
    where: { id: 3 }, update: {},
    create: { name: 'BBQ Chicken Pizza', description: 'Smoky BBQ base with grilled chicken', price: 13.99, cost: 4.0, categoryId: pizza.id, barcode: '003' },
  });

  // Products - Burgers
  await prisma.product.upsert({
    where: { id: 4 }, update: {},
    create: {
      name: 'Classic Burger', description: 'Beef patty with lettuce & tomato', price: 6.99, cost: 2.0,
      categoryId: burgers.id, barcode: '101',
      ingredients: { create: [
        { ingredientId: bun.id,   quantity: 1 },
        { ingredientId: patty.id, quantity: 1 },
      ]},
    },
  });

  await prisma.product.upsert({
    where: { id: 5 }, update: {},
    create: { name: 'Double Smash Burger', description: 'Two smashed patties', price: 9.99, cost: 3.2, categoryId: burgers.id, barcode: '102' },
  });

  // Drinks
  await prisma.product.upsert({
    where: { id: 6 }, update: {},
    create: {
      name: 'Cola', description: '330ml can', price: 1.99, cost: 0.4,
      categoryId: drinks.id, barcode: '201',
      ingredients: { create: [{ ingredientId: cola.id, quantity: 1 }]},
    },
  });

  await prisma.product.upsert({
    where: { id: 7 }, update: {},
    create: { name: 'Orange Juice', description: 'Fresh squeezed', price: 2.49, cost: 0.6, categoryId: drinks.id, barcode: '202' },
  });

  await prisma.product.upsert({
    where: { id: 8 }, update: {},
    create: { name: 'Water', description: '500ml bottle', price: 0.99, cost: 0.1, categoryId: drinks.id, barcode: '203' },
  });

  // Sides
  await prisma.product.upsert({
    where: { id: 9 }, update: {},
    create: {
      name: 'French Fries', description: 'Crispy golden fries', price: 2.99, cost: 0.8,
      categoryId: sides.id, barcode: '301',
      ingredients: { create: [{ ingredientId: fries.id, quantity: 0.2 }]},
    },
  });

  await prisma.product.upsert({
    where: { id: 10 }, update: {},
    create: { name: 'Onion Rings', description: 'Beer-battered onion rings', price: 3.49, cost: 1.0, categoryId: sides.id, barcode: '302' },
  });

  // Desserts
  await prisma.product.upsert({
    where: { id: 11 }, update: {},
    create: { name: 'Chocolate Lava Cake', description: 'Warm chocolate cake', price: 4.99, cost: 1.5, categoryId: desserts.id, barcode: '401' },
  });

  // Settings
  const defaultSettings = [
    ['shop_name',      'First Italian Pizza'],
    ['shop_address',   '123 Pizza Street, Karachi'],
    ['shop_phone',     '+92 300 1234567'],
    ['shop_email',     'info@firstitalianpizza.com'],
    ['currency',       'PKR'],
    ['currency_symbol','Rs'],
    ['tax_rate',       '0'],
    ['receipt_footer', 'Thank you for dining with us!'],
    ['print_receipt',  'true'],
  ];
  for (const [key, value] of defaultSettings) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  console.log('✅ Seed complete!');
  console.log('   Admin:   admin@pizza.com   / admin123');
  console.log('   Cashier: cashier@pizza.com / cashier123');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
