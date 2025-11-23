import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/cart - Get user's cart from database
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { cart: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Ensure cart is an object
    const cartItems = typeof user.cart === 'object' && user.cart !== null 
      ? user.cart 
      : {}

    return NextResponse.json({
      success: true,
      cartItems
    })
  } catch (error: any) {
    console.error('Error fetching cart:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch cart' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cart - Save user's cart to database
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
    const { cartItems } = body

    if (!cartItems || typeof cartItems !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid cart data' },
        { status: 400 }
      )
    }

    // Update user's cart in database
    await prisma.user.update({
      where: { id: userId },
      data: { cart: cartItems }
    })

    return NextResponse.json({
      success: true,
      message: 'Cart saved successfully'
    })
  } catch (error: any) {
    console.error('Error saving cart:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save cart' },
      { status: 500 }
    )
  }
}

