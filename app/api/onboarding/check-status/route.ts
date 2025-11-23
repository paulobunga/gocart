import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * Check if user has completed onboarding
 * This helps prevent redirect loops by checking the database directly
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        hasStore: false
      })
    }

    // Check if user has a store in the database
    const store = await prisma.store.findUnique({
      where: { userId },
      select: { id: true }
    })

    return NextResponse.json({
      success: true,
      hasStore: !!store,
      storeId: store?.id || null
    })
  } catch (error: any) {
    console.error('Error checking onboarding status:', error)
    return NextResponse.json(
      { success: false, hasStore: false, error: error.message },
      { status: 500 }
    )
  }
}

