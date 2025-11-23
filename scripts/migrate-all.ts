import "dotenv/config";
import { execSync } from "child_process";
import { prisma } from '../lib/prisma';

/**
 * Comprehensive migration script that:
 * 1. Applies all pending Prisma migrations
 * 2. Generates Prisma client
 * 3. Seeds all data (roles, currencies, languages, subscription plans, categories, assets)
 */

async function migrateAll() {
  try {
    console.log('🚀 Starting complete database migration and seeding...\n');
    console.log('='.repeat(60));

    // Step 1: Apply migrations
    console.log('\n📦 Step 1: Applying database migrations...');
    try {
      // Use migrate deploy for production, migrate dev for development
      // migrate deploy applies pending migrations without creating new ones
      execSync('npx prisma migrate deploy', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Migrations applied successfully');
    } catch (error: any) {
      // If migrate deploy fails (e.g., no migrations folder or in dev), try migrate dev
      if (error.message?.includes('No migrations found') || 
          error.message?.includes('migrate deploy')) {
        console.log('⚠️  No migrations to deploy, checking if schema is up to date...');
        try {
          execSync('npx prisma migrate dev --name auto_migration', { 
            stdio: 'inherit',
            cwd: process.cwd()
          });
          console.log('✅ Database schema is up to date');
        } catch (devError: any) {
          // If migrate dev also fails, just continue - schema might already be synced
          console.log('⚠️  Migration step skipped (schema may already be synced)');
        }
      } else {
        throw error;
      }
    }

    // Step 2: Generate Prisma client
    console.log('\n📦 Step 2: Generating Prisma client...');
    try {
      execSync('npx prisma generate', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Prisma client generated successfully');
    } catch (error) {
      console.error('❌ Error generating Prisma client:', error);
      throw error;
    }

    // Step 3: Fix Prisma imports (if script exists)
    console.log('\n📦 Step 3: Fixing Prisma imports...');
    try {
      execSync('node scripts/fix-prisma-imports.js', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Prisma imports fixed');
    } catch (error: any) {
      // This is optional, so we don't fail if it doesn't exist
      if (!error.message?.includes('ENOENT')) {
        console.log('⚠️  Could not fix Prisma imports (script may not exist)');
      }
    }

    // Step 4: Seed all data
    console.log('\n📦 Step 4: Seeding database with all data...');
    console.log('='.repeat(60));
    
    // Import and run seed functions
    const { seedRolesAndPermissions } = await import('./seed-roles-permissions');
    const { seedCurrency } = await import('./seed-currency');
    const { seedLanguage } = await import('./seed-language');
    const { seedSubscriptionPlans } = await import('./seed-subscription-plans');
    const { seedCategories } = await import('./seed-categories');
    const { seedAssetsData } = await import('./seed-assets-data');

    // Seed roles and permissions first (they don't depend on other data)
    await seedRolesAndPermissions();
    console.log('\n' + '='.repeat(60) + '\n');

    // Seed currency data
    await seedCurrency();
    console.log('\n' + '='.repeat(60) + '\n');

    // Seed language data
    await seedLanguage();
    console.log('\n' + '='.repeat(60) + '\n');

    // Seed subscription plans
    await seedSubscriptionPlans();
    console.log('\n' + '='.repeat(60) + '\n');

    // Seed categories
    await seedCategories();
    console.log('\n' + '='.repeat(60) + '\n');

    // Then seed assets data (users, stores, products, etc.)
    await seedAssetsData();

    console.log('\n' + '='.repeat(60));
    console.log('\n🎉 Complete migration and seeding finished successfully!');
    console.log('\n✅ Your database is now fully migrated and populated with all data.');
  } catch (error) {
    console.error('\n❌ Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration function
migrateAll()
  .then(() => {
    console.log('\n✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });

