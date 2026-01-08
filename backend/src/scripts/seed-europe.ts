import { adminService } from '../services/admin.service.js';

async function main() {
  console.log('Starting Europe seeding...');
  console.log('This may take 10-15 minutes...');

  try {
    const result = await adminService.seedEurope();
    console.log('\n=== Europe Seeding Complete ===');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
