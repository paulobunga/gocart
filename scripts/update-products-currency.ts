import "dotenv/config"
import { prisma } from '../lib/prisma'

async function updateProductsCurrency() {
  try {
    console.log('🔄 Updating existing products with default currency...\n')

    // Get default currency
    const defaultCurrencySetting = await prisma.setting.findUnique({
      where: { key: 'default_currency' }
    })

    let defaultCurrency
    if (defaultCurrencySetting) {
      defaultCurrency = await prisma.currency.findUnique({
        where: { id: defaultCurrencySetting.value }
      })
    }

    // If no default currency, get first active currency
    if (!defaultCurrency) {
      defaultCurrency = await prisma.currency.findFirst({
        where: { isActive: true },
        orderBy: { code: 'asc' }
      })
    }

    if (!defaultCurrency) {
      console.error('❌ No currency found. Please seed currencies first.')
      process.exit(1)
    }

    console.log(`📊 Using currency: ${defaultCurrency.symbol} ${defaultCurrency.name} (${defaultCurrency.code})\n`)

    // Get all products without currency
    const productsWithoutCurrency = await prisma.product.findMany({
      where: {
        currencyId: null
      }
    })

    console.log(`Found ${productsWithoutCurrency.length} products without currency\n`)

    if (productsWithoutCurrency.length === 0) {
      console.log('✅ All products already have currency assigned!')
      return
    }

    // Update all products
    const result = await prisma.product.updateMany({
      where: {
        currencyId: null
      },
      data: {
        currencyId: defaultCurrency.id
      }
    })

    console.log(`✅ Updated ${result.count} products with currency: ${defaultCurrency.code}\n`)
    console.log('✨ Product currency update completed successfully!')
  } catch (error) {
    console.error('❌ Error updating products currency:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateProductsCurrency()
  .then(() => {
    console.log('✅ Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })

