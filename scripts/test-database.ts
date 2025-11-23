import "dotenv/config"  // ✅ CRITICAL: Load environment variables
import { prisma } from "../lib/prisma"

async function testDatabase() {
  console.log("🔍 Testing Prisma Postgres connection...\n")

  try {
    // Test 1: Check connection
    await prisma.$connect()
    console.log("✅ Connected to database!")

    // Test 2: Count users
    console.log("\n📋 Fetching user count...")
    const userCount = await prisma.user.count()
    console.log(`✅ Found ${userCount} user(s) in database`)

    // Test 3: Count stores
    console.log("\n📋 Fetching store count...")
    const storeCount = await prisma.store.count()
    console.log(`✅ Found ${storeCount} store(s) in database`)

    // Test 4: Count products
    console.log("\n📋 Fetching product count...")
    const productCount = await prisma.product.count()
    console.log(`✅ Found ${productCount} product(s) in database`)

    console.log("\n🎉 All tests passed! Your database is working perfectly.\n")
  } catch (error) {
    console.error("❌ Error:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()

