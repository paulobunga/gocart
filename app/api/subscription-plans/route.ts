import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/subscription-plans - Get all active subscription plans
export async function GET(request: NextRequest) {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: {
        isActive: true
      },
      include: {
        currency: true // Include currency information
      },
      orderBy: {
        displayOrder: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: plans
    })
  } catch (error: any) {
    console.error('Error fetching subscription plans:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch subscription plans' },
      { status: 500 }
    )
  }
}

