const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

const tableMap = {
  User: 'user',
  Category: 'category',
  Product: 'product',
  ProductImage: 'productImage',
  ProductFeature: 'productFeature',
  Cart: 'cart',
  CartItems: 'cartItems',
  Order: 'order',
  OrderItems: 'orderItems',
};

function toDate(val) {
  if (!val) return null;
  // Handle Unix timestamp in milliseconds
  if (typeof val === 'number') return new Date(val);
  return new Date(val);
}

function transformRow(table, row) {
  const copy = { ...row };

  // Convert booleans stored as 0/1
  if (table === 'Product') {
    copy.featured = !!row.featured;
    copy.trending = !!row.trending;
    copy.latest = !!row.latest;
    if (row.created_at) copy.created_at = toDate(row.created_at);
    if (row.product_update_at) copy.product_update_at = toDate(row.product_update_at);
  }

  if (table === 'OrderItems') {
    copy.paid = !!row.paid;
  }

  if (table === 'Order') {
    if (row.created_at) copy.created_at = toDate(row.created_at);
  }

  if (table === 'Category') {
    if (row.created_at) copy.created_at = toDate(row.created_at);
  }

  return copy;
}

async function main() {
  const raw = fs.readFileSync('db.json', 'utf-8');
  const data = JSON.parse(raw);

  console.log('🚀 Starting import from db.json...');

  const insertOrder = [
    'User',
    'Category',
    'Product',
    'ProductImage',
    'ProductFeature',
    'Cart',
    'CartItems',
    'Order',
    'OrderItems',
  ];

  for (const table of insertOrder) {
    const prismaModel = tableMap[table];
    if (!prismaModel) continue;

    let rows = data[table] || [];
    if (rows.length === 0) continue;

    rows = rows.map((row) => transformRow(table, row));

    try {
      await prisma[prismaModel].createMany({
        data: rows,
        skipDuplicates: true,
      });
      console.log(`✅ Inserted ${rows.length} records into ${table}`);
    } catch (err) {
      console.error(`❌ Error inserting ${table}:`, err.message);
    }
  }

  console.log('🎉 Import finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
