import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seed() {
  const password = await bcrypt.hash('password123', 10);
  
  const users = [
    { email: 'admin@example.com', name: 'Operations Director', role: 'ADMIN' },
    { email: 'sales@example.com', name: 'Sales Exec', role: 'SALES' },
    { email: 'warehouse@example.com', name: 'Warehouse Mgr', role: 'WAREHOUSE' },
    { email: 'accounts@example.com', name: 'Accounts Exec', role: 'ACCOUNTS' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role },
      create: { ...u, password }
    });
  }
  
  console.log('Roles seeded successfully!');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
