import { prisma } from '../config/database.js';
import bcryptjs from 'bcryptjs';

async function main() {
  const email = 'admin@tourist-app.com';
  const newPassword = 'Admin@123';

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.log('[Reset] Admin user not found, creating...');
      const hash = await bcryptjs.hash(newPassword, 10);
      await prisma.user.create({
        data: {
          email,
          name: 'Admin User',
          passwordHash: hash,
          role: 'admin',
          authProvider: 'email',
          emailVerified: true,
        }
      });
      console.log('[Reset] Admin user created');
    } else {
      console.log('[Reset] Resetting admin password...');
      const hash = await bcryptjs.hash(newPassword, 10);
      await prisma.user.update({
        where: { email },
        data: { passwordHash: hash }
      });
      console.log('[Reset] Password reset complete');
    }

    console.log('[Reset] Email:', email);
    console.log('[Reset] Password:', newPassword);
  } catch (error) {
    console.error('[Reset] Error:', error);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
