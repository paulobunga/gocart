import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

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
    const { 
      items, 
      total, 
      addressId, 
      paymentMethod, 
      paymentTransactionId,
      coupon,
      storeId 
    } = body

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order items are required' },
        { status: 400 }
      )
    }

    if (!total || total <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid total amount is required' },
        { status: 400 }
      )
    }

    if (!addressId) {
      return NextResponse.json(
        { success: false, error: 'Shipping address is required' },
        { status: 400 }
      )
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Payment method is required' },
        { status: 400 }
      )
    }

    // Determine if payment is required upfront
    const isPaid = paymentMethod !== 'COD' && paymentTransactionId

    // Get the store ID from the first item if not provided
    const firstItemStoreId = items[0]?.storeId || storeId
    if (!firstItemStoreId) {
      return NextResponse.json(
        { success: false, error: 'Store ID is required' },
        { status: 400 }
      )
    }

    // Create the order with order items
    const order = await prisma.order.create({
      data: {
        total,
        userId,
        storeId: firstItemStoreId,
        addressId,
        isPaid,
        paymentMethod: paymentMethod as any, // Type assertion for enum
        isCouponUsed: !!coupon,
        coupon: coupon || {},
        orderItems: {
          create: items.map((item: any) => ({
            productId: item.productId || item.id,
            variantId: item.variantId || null,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        orderItems: {
          include: {
            product: true,
            variant: {
              include: {
                attributes: {
                  include: {
                    value: {
                      include: {
                        attribute: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        address: true,
        store: true,
      },
    })

    return NextResponse.json({
      success: true,
      orderId: order.id,
      order,
      message: 'Order created successfully'
    })
  } catch (error: any) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create order' },
      { status: 500 }
    )
  }
}

