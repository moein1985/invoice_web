import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Hash password for admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Create admin user (unlimited approval)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: hashedPassword,
      fullName: 'مدیر سیستم',
      role: 'admin',
      isActive: true,
      maxApprovalAmount: null, // نامحدود
    },
  });

  console.log('Admin user created:', admin.username);

  // Create a test manager (max 500 million)
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
      maxApprovalAmount: 500000000, // 500 میلیون تومان
    },
  });

  console.log('Manager user created:', manager.username);

  // Create a supervisor (max 100 million)
  const supervisorPassword = await bcrypt.hash('supervisor123', 10);
  const supervisor = await prisma.user.upsert({
    where: { username: 'supervisor' },
    update: {},
    create: {
      username: 'supervisor',
      passwordHash: supervisorPassword,
      fullName: 'سرپرست فروش',
      role: 'supervisor',
      isActive: true,
      maxApprovalAmount: 100000000, // 100 میلیون تومان
    },
  });

  console.log('Supervisor user created:', supervisor.username);

  // Create an employee (max 10 million)
  const employeePassword = await bcrypt.hash('employee123', 10);
  const employee = await prisma.user.upsert({
    where: { username: 'employee' },
    update: {},
    create: {
      username: 'employee',
      passwordHash: employeePassword,
      fullName: 'کارمند فروش',
      role: 'employee',
      isActive: true,
      maxApprovalAmount: 10000000, // 10 میلیون تومان
    },
  });

  console.log('Employee user created:', employee.username);

  // Create a test user (no approval rights)
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
      maxApprovalAmount: null,
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
        documentNumber: 'INV-2024-000001',
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
        notes: 'فاکتور نمونه',
        items: {
          create: [
            {
              description: 'محصول A - بسته 10 عددی',
              quantity: 50,
              purchasePrice: 150000,
              unitPrice: 200000,
              totalPrice: 10000000,
              profitAmount: 2500000,
              profitPercentage: 33.33,
            },
            {
              description: 'محصول B - بسته 5 عددی',
              quantity: 50,
              purchasePrice: 80000,
              unitPrice: 100000,
              totalPrice: 5000000,
              profitAmount: 1000000,
              profitPercentage: 25,
            },
          ],
        },
      },
    });

    console.log('Sample invoice created');
  }

  if (customer2) {
    // Create a temp proforma (پیش‌فاکتور موقت)
    await prisma.document.create({
      data: {
        documentNumber: 'TMP-2024-000001',
        documentType: 'temp_proforma',
        customerId: customer2.id,
        issueDate: new Date('2024-01-20'),
        dueDate: new Date('2024-02-20'),
        totalAmount: 8000000,
        discountAmount: 0,
        finalAmount: 8000000,
        totalPurchaseAmount: 6000000,
        totalProfitAmount: 2000000,
        status: 'draft',
        approvalStatus: 'pending',
        requiresApproval: true,
        defaultProfitPercentage: 30,
        notes: 'پیش‌فاکتور موقت - نیاز به تأیید سرپرست',
        createdBy: employee.id,
        items: {
          create: [
            {
              description: 'محصول C - جعبه 20 عددی',
              quantity: 40,
              purchasePrice: 150000,
              unitPrice: 200000,
              totalPrice: 8000000,
              profitAmount: 2000000,
              profitPercentage: 33.33,
            },
          ],
        },
      },
    });

    console.log('Sample temp proforma created');
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
