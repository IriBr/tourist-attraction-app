import { prisma } from '../config/database.js';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  const email = process.argv[2] || 'admin@tourist.app';
  const password = process.argv[3] || 'admin123';
  const name = process.argv[4] || 'Admin User';

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Update to admin
      await prisma.user.update({
        where: { email },
        data: { role: 'admin' },
      });
      console.log(`User ${email} has been promoted to admin.`);
    } else {
      // Create new admin user
      const passwordHash = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          role: 'admin',
          emailVerified: true,
        },
      });
      console.log(`Admin user created: ${email}`);
      console.log(`Password: ${password}`);
    }

    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
