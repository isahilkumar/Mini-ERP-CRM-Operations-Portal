import prisma from './src/utils/db';
import bcrypt from 'bcrypt';

async function seed() {
  const password = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password,
      role: 'ADMIN',
    },
  });

  console.log('Seed successful. You can log in with:');
  console.log('Email: admin@example.com');
  console.log('Password: password123');
}

seed()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
