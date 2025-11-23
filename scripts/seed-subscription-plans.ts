import "dotenv/config"
import { prisma } from '../lib/prisma'

export async function seedSubscriptionPlans() {
  try {
    console.log('🌱 Seeding subscription plans...\n')

    // Get default currency from settings
    const defaultCurrencySetting = await prisma.setting.findUnique({
      where: { key: 'default_currency' }
    })

    let defaultCurrency
    if (defaultCurrencySetting) {
      defaultCurrency = await prisma.currency.findUnique({
        where: { id: defaultCurrencySetting.value }
      })
    }

    // If no default currency, get first active currency or create UGX as fallback
    if (!defaultCurrency) {
      defaultCurrency = await prisma.currency.findFirst({
        where: { isActive: true },
        orderBy: { code: 'asc' }
      })

      if (!defaultCurrency) {
        // Create UGX as default if no currencies exist
        defaultCurrency = await prisma.currency.create({
          data: {
            code: 'UGX',
            name: 'Ugandan Shilling',
            symbol: 'USh',
            exchangeRate: 1.0,
            isActive: true
          }
        })
        console.log('  ⚠️  No default currency found. Created UGX as default.')
      }
    }

    console.log(`  📊 Using currency: ${defaultCurrency.symbol} ${defaultCurrency.name} (${defaultCurrency.code})\n`)

    const plans = [
      {
        type: 'FREE',
        name: 'Free',
        monthlyPrice: 0,
        annualPrice: 0,
        currencyId: defaultCurrency.id,
        maxProducts: 10,
        maxImagesPerProduct: 3,
        features: [
          'Up to 10 products',
          '3 images per product',
          'Basic store features',
          'Community support'
        ],
        isActive: true,
        displayOrder: 1
      },
      {
        type: 'PREMIUM',
        name: 'Premium',
        monthlyPrice: defaultCurrency.code === 'UGX' ? 110000 : 29.99, // Convert to UGX if default is UGX
        annualPrice: defaultCurrency.code === 'UGX' ? 1100000 : 299.99,
        currencyId: defaultCurrency.id,
        maxProducts: 100,
        maxImagesPerProduct: 10,
        features: [
          'Up to 100 products',
          '10 images per product',
          'Advanced analytics',
          'Priority support',
          'Custom branding'
        ],
        isActive: true,
        displayOrder: 2
      },
      {
        type: 'BUSINESS',
        name: 'Business',
        monthlyPrice: defaultCurrency.code === 'UGX' ? 370000 : 99.99,
        annualPrice: defaultCurrency.code === 'UGX' ? 3700000 : 999.99,
        currencyId: defaultCurrency.id,
        maxProducts: -1, // Unlimited
        maxImagesPerProduct: 20,
        features: [
          'Unlimited products',
          '20 images per product',
          'Advanced analytics',
          '24/7 priority support',
          'Custom branding',
          'API access'
        ],
        isActive: true,
        displayOrder: 3
      }
    ]

    for (const planData of plans) {
      const existing = await prisma.subscriptionPlan.findUnique({
        where: { type: planData.type }
      })

      if (existing) {
        await prisma.subscriptionPlan.update({
          where: { type: planData.type },
          data: planData
        })
        console.log(`  ✅ Updated plan: ${planData.name} (${defaultCurrency.symbol}${planData.monthlyPrice}/${defaultCurrency.symbol}${planData.annualPrice})`)
      } else {
        await prisma.subscriptionPlan.create({
          data: planData
        })
        console.log(`  ✅ Created plan: ${planData.name} (${defaultCurrency.symbol}${planData.monthlyPrice}/${defaultCurrency.symbol}${planData.annualPrice})`)
      }
    }

    console.log('\n✅ Subscription plans seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Only run if called directly (not imported)
if (require.main === module) {
  seedSubscriptionPlans()
    .then(() => {
      console.log('✅ Seed script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Seed script failed:', error)
      process.exit(1)
    })
}

