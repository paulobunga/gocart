import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { processPayPalPayment } from '@/lib/payments/paypal'

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
    const { plan, billing, paymentProvider, amount, currency = 'USD', formData } = body

    if (paymentProvider === 'PAYPAL') {
      const result = await processPayPalPayment(amount, currency, 'Vendor Subscription')
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || 'PayPal payment initiation failed' },
          { status: 400 }
        )
      }

      // Store form data in the redirect URL for onboarding completion after payment
      // In production, you'd store this in a database or session
      const redirectUrl = new URL(result.redirectUrl || '')
      redirectUrl.searchParams.set('orderId', result.orderId || '')
      
      // Store form data as base64 encoded JSON in URL (or use session/database in production)
      if (formData) {
        const formDataEncoded = Buffer.from(JSON.stringify(formData)).toString('base64')
        redirectUrl.searchParams.set('formData', formDataEncoded)
      }

      return NextResponse.json({
        success: true,
        redirectUrl: redirectUrl.toString(),
        orderId: result.orderId,
        message: 'PayPal payment initiated'
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid payment provider for initiation' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error initiating payment:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to initiate payment' },
      { status: 500 }
    )
  }
}

