import "dotenv/config"
import { prisma } from '../lib/prisma'

/**
 * Setup script for vendor onboarding
 * This script helps verify that all necessary configurations are in place
 */

async function checkDatabaseSchema() {
  console.log('🔍 Checking database schema...')
  
  try {
    // Check if VendorSubscription model exists by trying to query it
    // Using dynamic access to avoid TypeScript errors if model doesn't exist
    const vendorSubscription = (prisma as any).vendorSubscription
    if (vendorSubscription) {
      const count = await vendorSubscription.count()
      console.log('✅ VendorSubscription model exists')
      console.log(`   Found ${count} existing subscriptions`)
      return true
    } else {
      console.error('❌ VendorSubscription model not found')
      console.error('   Run: npx prisma migrate dev --name add_vendor_subscriptions')
      console.error('   Then: npx prisma generate')
      return false
    }
  } catch (error: any) {
    if (error.message?.includes('does not exist') || 
        error.message?.includes('Unknown model') ||
        error.message?.includes('Cannot read property')) {
      console.error('❌ VendorSubscription model not found')
      console.error('   Run: npx prisma migrate dev --name add_vendor_subscriptions')
      console.error('   Then: npx prisma generate')
      return false
    }
    throw error
  }
}

function checkEnvironmentVariables() {
  console.log('\n🔍 Checking environment variables...')
  
  const required = [
    'DATABASE_URL',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY'
  ]
  
  const optional = [
    'PAYPAL_CLIENT_ID',
    'PAYPAL_CLIENT_SECRET',
    'IOTEC_API_KEY',
    'IOTEC_API_SECRET',
    'RESEND_API_KEY',
    'SENDGRID_API_KEY',
    'EMAIL_PROVIDER'
  ]
  
  let allRequired = true
  
  for (const key of required) {
    if (process.env[key]) {
      console.log(`✅ ${key}`)
    } else {
      console.error(`❌ ${key} - Missing`)
      allRequired = false
    }
  }
  
  console.log('\n📋 Optional variables (for payment/email):')
  for (const key of optional) {
    if (process.env[key]) {
      console.log(`✅ ${key}`)
    } else {
      console.log(`⚠️  ${key} - Not configured (will use mock/development mode)`)
    }
  }
  
  return allRequired
}

function checkClerkConfiguration() {
  console.log('\n📝 Clerk Configuration Checklist:')
  console.log('   1. Go to Clerk Dashboard → Sessions')
  console.log('   2. Under "Customize session token", add:')
  console.log('      { "metadata": "{{user.public_metadata}}" }')
  console.log('   3. Click Save')
  console.log('\n   ⚠️  This step must be done manually in Clerk Dashboard')
}

async function main() {
  console.log('🚀 Vendor Onboarding Setup Check\n')
  console.log('=' .repeat(50))
  
  const dbOk = await checkDatabaseSchema()
  const envOk = checkEnvironmentVariables()
  checkClerkConfiguration()
  
  console.log('\n' + '='.repeat(50))
  
  if (dbOk && envOk) {
    console.log('\n✅ Setup check completed!')
    console.log('\n📋 Next steps:')
    console.log('   1. Configure Clerk session token (see above)')
    console.log('   2. Install payment provider SDKs if needed:')
    console.log('      - PayPal: npm install @paypal/checkout-server-sdk')
    console.log('      - Iotec: Check Iotec documentation for SDK')
    console.log('   3. Install email provider SDK:')
    console.log('      - Resend: npm install resend')
    console.log('      - SendGrid: npm install @sendgrid/mail')
    console.log('      - Nodemailer: npm install nodemailer')
    console.log('   4. Update payment/email integration files with actual SDK calls')
    console.log('   5. Test the onboarding flow at /onboarding')
  } else {
    console.log('\n⚠️  Some setup steps are incomplete')
    console.log('   Please fix the issues above and run this script again')
  }
  
  await prisma.$disconnect()
}

main()
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
