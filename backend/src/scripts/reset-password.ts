import { prisma } from '../config/database.js';
import bcryptjs from 'bcryptjs';

async function main() {
  const email = 'zamir.brahimaj@beachmaster.io';
  const newPassword = 'Password123';
  
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.log('User not found:', email);
    return;
  }
  
  const hash = await bcryptjs.hash(newPassword, 10);
  await prisma.user.update({
    where: { email },
    data: { passwordHash: hash }
  });
  
  console.log('Password reset!');
  console.log('Email:', email);
  console.log('New Password:', newPassword);
}

main().catch(console.error).finally(() => prisma.$disconnect());
