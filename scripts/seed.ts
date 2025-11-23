import "dotenv/config";
import { prisma } from '../lib/prisma';
import { seedRolesAndPermissions } from './seed-roles-permissions';
import { seedAssetsData } from './seed-assets-data';
import { seedCurrency } from './seed-currency';

async function seed() {
  try {
    console.log('🚀 Starting database seeding...\n');
    console.log('='.repeat(50));
    
    // Seed roles and permissions first (they don't depend on other data)
    await seedRolesAndPermissions();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Seed currency data
    await seedCurrency();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Then seed assets data (users, stores, products, etc.)
    await seedAssetsData();
    
    console.log('\n' + '='.repeat(50));
    console.log('\n🎉 All seeding completed successfully!');
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log('✅ Seed script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });

