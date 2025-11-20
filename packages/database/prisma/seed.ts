import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Hash password for admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: hashedPassword,
      fullName: 'مدیر سیستم',
      role: 'admin',
      isActive: true,
    },
  });

  console.log('Admin user created:', admin.username);

  // Create a test manager
  const managerPassword = await bcrypt.hash('manager123', 10);
  const manager = await prisma.user.upsert({
    where: { username: 'manager' },
    update: {},
    create: {
      username: 'manager',
      passwordHash: managerPassword,
      fullName: 'مدیر فروش',
      role: 'manager',
      isActive: true,
    },
  });

  console.log('Manager user created:', manager.username);

  // Create a test user
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { username: 'user' },
    update: {},
    create: {
      username: 'user',
      passwordHash: userPassword,
      fullName: 'کاربر تست',
      role: 'user',
      isActive: true,
    },
  });

  console.log('Regular user created:', user.username);

  // Create sample customers
  const customers = [
    {
      code: 'CUST001',
      name: 'شرکت تجارت الکترونیک پارس',
      phone: '02188776655',
      email: 'info@pars-trade.com',
      address: 'تهران، خیابان ولیعصر، پلاک 123',
      creditLimit: 50000000,
    },
    {
      code: 'CUST002',
      name: 'فروشگاه زنجیره‌ای آپادانا',
      phone: '02177665544',
      email: 'sales@apadana.com',
      address: 'تهران، میدان ونک',
      creditLimit: 30000000,
    },
    {
      code: 'CUST003',
      name: 'شرکت صنایع غذایی آذین',
      phone: '02166554433',
      email: 'contact@azinfood.ir',
      address: 'کرج، شهرک صنعتی',
      creditLimit: 100000000,
    },
  ];

  for (const customerData of customers) {
    await prisma.customer.upsert({
      where: { code: customerData.code },
      update: {},
      create: customerData,
    });
  }

  console.log(`${customers.length} sample customers created`);

  // Create sample documents
  const customer1 = await prisma.customer.findUnique({ where: { code: 'CUST001' } });
  const customer2 = await prisma.customer.findUnique({ where: { code: 'CUST002' } });

  if (customer1) {
    // Create an invoice
    await prisma.document.create({
      data: {
        documentNumber: 'DOC-2024-000001',
        documentType: 'invoice',
        customerId: customer1.id,
        issueDate: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
        totalAmount: 15000000,
        discountAmount: 500000,
        finalAmount: 14500000,
        status: 'approved',
        approvalStatus: 'approved',
        createdBy: admin.id,
        items: {
          create: [
            {
              description: 'محصول A - بسته 10 عددی',
              quantity: 50,
              unitPrice: 200000,
              totalPrice: 10000000,
            },
            {
              description: 'محصول B - بسته 5 عددی',
              quantity: 50,
              unitPrice: 100000,
              totalPrice: 5000000,
            },
          ],
        },
      },
    });

    console.log('Sample invoice created');
  }

  if (customer2) {
    // Create a quote
    await prisma.document.create({
      data: {
        documentNumber: 'DOC-2024-000002',
        documentType: 'quote',
        customerId: customer2.id,
        issueDate: new Date('2024-01-20'),
        dueDate: new Date('2024-02-20'),
        totalAmount: 8000000,
        discountAmount: 0,
        finalAmount: 8000000,
        status: 'draft',
        approvalStatus: 'pending',
        createdBy: manager.id,
        items: {
          create: [
            {
              description: 'محصول C - جعبه 20 عددی',
              quantity: 40,
              unitPrice: 200000,
              totalPrice: 8000000,
            },
          ],
        },
      },
    });

    console.log('Sample quote created');
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
