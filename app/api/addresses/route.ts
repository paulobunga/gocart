import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/addresses - Get all addresses for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: addresses
    })
  } catch (error: any) {
    console.error('Error fetching addresses:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch addresses' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/addresses - Create a new address for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, email, street, city, state, zip, country, phone } = body

    // Validate required fields
    if (!name || !email || !street || !city || !state || !zip || !country || !phone) {
      return NextResponse.json(
        { success: false, error: 'All address fields are required' },
        { status: 400 }
      )
    }

    // Check if user exists in database
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found in database. Please sign in again.' },
        { status: 404 }
      )
    }

    // Check if this is the first address for the user
    const existingAddresses = await prisma.address.findMany({
      where: { userId }
    })

    const isFirstAddress = existingAddresses.length === 0

    // Create the address
    const address = await prisma.address.create({
      data: {
        userId,
        name,
        email,
        street,
        city,
        state,
        zip,
        country,
        phone
      }
    })

    return NextResponse.json({
      success: true,
      data: address,
      isFirstAddress // Indicate if this is the first address (for auto-selection)
    })
  } catch (error: any) {
    console.error('Error creating address:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create address' },
      { status: 500 }
    )
  }
}

