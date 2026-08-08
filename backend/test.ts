import prisma from './src/utils/db';

async function main() {
  try {
    const user = await prisma.user.findUnique({ where: { email: 'admin@example.com' } });
    console.log('User query successful:', user);
  } catch (error) {
    console.error('Database query error:', error);
  }
}

main().catch(console.error);
