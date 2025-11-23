import "dotenv/config";
import { prisma } from '../lib/prisma';

async function resetDatabase() {
  try {
    console.log('🗑️  Resetting database...\n');

    // Delete all data in the correct order to respect foreign key constraints
    console.log('  Deleting ratings...');
    await prisma.rating.deleteMany();
    
    console.log('  Deleting order items...');
    await prisma.orderItem.deleteMany();
    
    console.log('  Deleting orders...');
    await prisma.order.deleteMany();
    
    console.log('  Deleting addresses...');
    await prisma.address.deleteMany();
    
    console.log('  Deleting products...');
    await prisma.product.deleteMany();
    
    console.log('  Deleting vendor subscriptions...');
    await prisma.vendorSubscription.deleteMany();
    
    console.log('  Deleting subscription plans...');
    await prisma.subscriptionPlan.deleteMany();
    
    console.log('  Deleting stores...');
    await prisma.store.deleteMany();
    
    console.log('  Deleting coupons...');
    await prisma.coupon.deleteMany();
    
    console.log('  Deleting user roles...');
    await prisma.userRole.deleteMany();
    
    console.log('  Deleting role permissions...');
    await prisma.rolePermission.deleteMany();
    
    console.log('  Deleting permissions...');
    await prisma.permission.deleteMany();
    
    console.log('  Deleting roles...');
    await prisma.role.deleteMany();
    
    console.log('  Deleting users...');
    await prisma.user.deleteMany();
    
    console.log('  Deleting languages...');
    await prisma.language.deleteMany();
    
    console.log('  Deleting currencies...');
    await prisma.currency.deleteMany();
    
    console.log('  Deleting settings...');
    await prisma.setting.deleteMany();

    console.log('\n✅ Database reset completed!');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase()
  .then(() => {
    console.log('✅ Reset script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Reset script failed:', error);
    process.exit(1);
  });

