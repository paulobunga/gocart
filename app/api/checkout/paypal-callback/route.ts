import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { verifyPayPalPayment } from '@/lib/payments/paypal'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }

    const searchParams = request.nextUrl.searchParams
    const success = searchParams.get('success')
    const orderId = searchParams.get('orderId') || searchParams.get('token')
    const orderDataEncoded = searchParams.get('orderData')
    const payerId = searchParams.get('PayerID')

    // If payment was cancelled
    if (success === 'false' || !orderId) {
      return NextResponse.redirect(
        new URL('/checkout?payment=cancelled', request.url)
      )
    }

    // Verify payment with PayPal
    const paymentVerified = await verifyPayPalPayment(orderId)
    
    if (!paymentVerified) {
      return NextResponse.redirect(
        new URL('/checkout?payment=failed', request.url)
      )
    }

    // Decode order data and create order
    if (!orderDataEncoded) {
      return NextResponse.redirect(
        new URL('/checkout?payment=error', request.url)
      )
    }

    try {
      const orderData = JSON.parse(Buffer.from(orderDataEncoded, 'base64').toString())
      
      // Create the order with payment transaction ID
      const order = await prisma.order.create({
        data: {
          total: orderData.total,
          userId,
          storeId: orderData.storeId || orderData.items[0]?.storeId,
          addressId: orderData.addressId,
          isPaid: true,
          paymentMethod: 'PAYPAL' as any,
          paymentTransactionId: orderId,
          isCouponUsed: !!orderData.coupon,
          coupon: orderData.coupon || {},
          orderItems: {
            create: orderData.items.map((item: any) => ({
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

      return NextResponse.redirect(
        new URL(`/orders?payment=success&orderId=${order.id}`, request.url)
      )
    } catch (error: any) {
      console.error('Error creating order in callback:', error)
      return NextResponse.redirect(
        new URL(`/checkout?payment=error&error=${encodeURIComponent(error.message)}`, request.url)
      )
    }
  } catch (error: any) {
    console.error('Error in PayPal checkout callback:', error)
    return NextResponse.redirect(
      new URL('/checkout?payment=error', request.url)
    )
  }
}

