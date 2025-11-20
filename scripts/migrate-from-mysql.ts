const { PrismaClient } = require('../packages/database');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Prisma Client
const prisma = new PrismaClient();

// MySQL Connection Config
const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'old_invoice_db',
};

console.log('Script loaded');

async function migrate() {
  console.log('🚀 Starting migration from MySQL to PostgreSQL...');
  
  let mysqlConnection;

  try {
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL');

    // Connect to MySQL
    mysqlConnection = await mysql.createConnection(mysqlConfig);
    console.log('✅ Connected to MySQL');

    // 1. Migrate Users
    console.log('📦 Migrating Users...');
    const [users] = await mysqlConnection.execute('SELECT * FROM users');
    
    for (const user of users as any[]) {
      const existingUser = await prisma.user.findUnique({
        where: { username: user.username },
      });

      if (!existingUser) {
        await prisma.user.create({
          data: {
            username: user.username,
            passwordHash: user.password, // Assuming already hashed or needs hashing?
            fullName: user.full_name || user.username,
            role: user.role === 'admin' ? 'admin' : 'user',
            isActive: user.is_active === 1,
          },
        });
      }
    }
    console.log(`✅ Migrated ${(users as any[]).length} users.`);

    // 2. Migrate Customers
    console.log('📦 Migrating Customers...');
    const [customers] = await mysqlConnection.execute('SELECT * FROM customers');
    
    // Map old IDs to new UUIDs if necessary, or just create new ones
    const customerIdMap = new Map<number, string>();

    for (const customer of customers as any[]) {
      const newCustomer = await prisma.customer.create({
        data: {
          code: customer.economic_code || `CUST-${customer.id}`, // Fallback to ID if no economic code
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          // economicCode: customer.economic_code, // Not in schema
          // nationalId: customer.national_id, // Not in schema
          // registrationNumber: customer.registration_number, // Not in schema
          isActive: customer.is_active === 1,
        },
      });
      customerIdMap.set(customer.id, newCustomer.id);
    }
    console.log(`✅ Migrated ${(customers as any[]).length} customers.`);

    // 3. Migrate Documents (Invoices)
    console.log('📦 Migrating Documents...');
    const [invoices] = await mysqlConnection.execute('SELECT * FROM invoices');

    // Find a default user for createdBy (e.g., the first admin or just the first user)
    const defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
        console.error('❌ No users found to assign documents to.');
        return;
    }

    for (const invoice of invoices as any[]) {
      const newCustomerId = customerIdMap.get(invoice.customer_id);
      
      if (newCustomerId) {
        // Fetch invoice items
        const [items] = await mysqlConnection.execute(
          'SELECT * FROM invoice_items WHERE invoice_id = ?',
          [invoice.id]
        );

        await prisma.document.create({
          data: {
            documentType: 'invoice', // Assuming all are invoices
            status: mapStatus(invoice.status),
            documentNumber: invoice.number, // Or generate new one
            issueDate: new Date(invoice.date),
            dueDate: invoice.due_date ? new Date(invoice.due_date) : null,
            customerId: newCustomerId,
            totalAmount: Number(invoice.total_amount),
            discountAmount: Number(invoice.discount_amount || 0),
            finalAmount: Number(invoice.final_amount),
            // description: invoice.description, // Not in schema
            createdBy: defaultUser.id, // Assign to default user
            items: {
              create: (items as any[]).map((item) => ({
                description: item.description,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unit_price),
                totalPrice: Number(item.total_price),
              })),
            },
          },
        });
      }
    }
    console.log(`✅ Migrated ${(invoices as any[]).length} documents.`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    if (mysqlConnection) await mysqlConnection.end();
    await prisma.$disconnect();
  }
}

function mapStatus(oldStatus: string): any {
  switch (oldStatus.toLowerCase()) {
    case 'draft': return 'draft';
    case 'sent': return 'pending'; // Mapping 'sent' to 'pending'
    case 'paid': return 'approved'; // Mapping 'paid' to 'approved'
    case 'cancelled': return 'rejected'; // Mapping 'cancelled' to 'rejected'
    default: return 'draft';
  }
}

migrate();
