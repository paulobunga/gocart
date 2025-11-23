import "dotenv/config";
import { prisma } from '../lib/prisma';

async function _seedCurrency() {
  try {
    console.log('🌱 Seeding currency data...');

    // Define common currencies
    const currencies = [
      { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', exchangeRate: 1.0, isActive: true },
      { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 0.00027, isActive: true },
      { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 0.00025, isActive: true },
      { code: 'GBP', name: 'British Pound', symbol: '£', exchangeRate: 0.00021, isActive: true },
      { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', exchangeRate: 0.035, isActive: true },
      { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', exchangeRate: 0.63, isActive: true },
      { code: 'RWF', name: 'Rwandan Franc', symbol: 'RF', exchangeRate: 0.33, isActive: true },
    ];

    // Create currencies
    console.log('📝 Creating currencies...');
    for (const currency of currencies) {
      const existing = await prisma.currency.findUnique({
        where: { code: currency.code },
      });

      if (existing) {
        console.log(`  ⏭️  Currency "${currency.code}" already exists`);
      } else {
        await prisma.currency.create({
          data: currency,
        });
        console.log(`  ✅ Created currency: ${currency.code} (${currency.name})`);
      }
    }

    // Create default currency setting
    console.log('\n📝 Creating default currency setting...');
    const defaultCurrency = await prisma.currency.findUnique({
      where: { code: 'UGX' },
    });

    if (defaultCurrency) {
      const existingSetting = await prisma.setting.findUnique({
        where: { key: 'default_currency' },
      });

      if (existingSetting) {
        await prisma.setting.update({
          where: { key: 'default_currency' },
          data: { value: defaultCurrency.id },
        });
        console.log(`  ✅ Updated default currency setting to UGX`);
      } else {
        await prisma.setting.create({
          data: {
            key: 'default_currency',
            value: defaultCurrency.id,
          },
        });
        console.log(`  ✅ Created default currency setting: UGX`);
      }
    } else {
      console.log(`  ⚠️  Warning: UGX currency not found, cannot set default currency`);
    }

    console.log('\n✨ Currency seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding currency:', error);
    throw error;
  }
}

// Export function without disconnect (for use in unified seed)
export async function seedCurrency() {
  return _seedCurrency();
}

// Allow running this file directly via tsx
const isMainModule = process.argv[1]?.includes('seed-currency.ts');

if (isMainModule) {
  (async () => {
    try {
      await _seedCurrency();
      console.log('✅ Seed script completed');
    } catch (error) {
      console.error('❌ Seed script failed:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
      process.exit(0);
    }
  })();
}

