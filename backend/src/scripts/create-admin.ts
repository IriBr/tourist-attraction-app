import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  const email = 'admin@tourist-app.com';
  const password = 'Admin@123';
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: 'admin' },
    create: {
      email,
      name: 'Admin User',
      passwordHash,
      emailVerified: true,
      authProvider: 'email',
      role: 'admin',
    },
  });

  console.log(`Admin user created/updated:`);
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  Role: ${admin.role}`);

  await prisma.$disconnect();
}

createAdmin().catch(console.error);
