import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { verifyPayPalPayment } from '@/lib/payments/paypal'
import { completeVendorOnboarding } from '@/../(public)/onboarding/_actions'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }

    const searchParams = request.nextUrl.searchParams
    const success = searchParams.get('success')
    const orderId = searchParams.get('orderId') || searchParams.get('token')
    const formDataEncoded = searchParams.get('formData')
    const payerId = searchParams.get('PayerID')

    // If payment was cancelled
    if (success === 'false' || !orderId) {
      return NextResponse.redirect(
        new URL('/onboarding?payment=cancelled', request.url)
      )
    }

    // Verify payment with PayPal
    const paymentVerified = await verifyPayPalPayment(orderId)
    
    if (!paymentVerified) {
      return NextResponse.redirect(
        new URL('/onboarding?payment=failed', request.url)
      )
    }

    // Decode form data and complete onboarding
    if (!formDataEncoded) {
      return NextResponse.redirect(
        new URL('/onboarding?payment=error', request.url)
      )
    }

    try {
      const formData = JSON.parse(Buffer.from(formDataEncoded, 'base64').toString())
      
      // Complete onboarding with payment transaction ID
      const result = await completeVendorOnboarding({
        ...formData,
        paymentProvider: 'PAYPAL',
        paymentTransactionId: orderId
      })

      if (result.success) {
        return NextResponse.redirect(
          new URL(`/onboarding/confirmation?storeId=${result.storeId}&payment=success`, request.url)
        )
      } else {
        return NextResponse.redirect(
          new URL(`/onboarding?payment=error&error=${encodeURIComponent(result.error || 'Failed to complete onboarding')}`, request.url)
        )
      }
    } catch (error: any) {
      console.error('Error completing onboarding in callback:', error)
      return NextResponse.redirect(
        new URL(`/onboarding?payment=error&error=${encodeURIComponent(error.message)}`, request.url)
      )
    }
  } catch (error: any) {
    console.error('Error in PayPal callback:', error)
    return NextResponse.redirect(
      new URL('/onboarding?payment=error', request.url)
    )
  }
}

