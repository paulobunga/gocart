import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { processIotecPayment } from '@/lib/payments/iotec'
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
    const { paymentProvider, amount, phoneNumber, currency = 'UGX', orderData } = body

    if (!paymentProvider || !amount) {
      return NextResponse.json(
        { success: false, error: 'Payment provider and amount are required' },
        { status: 400 }
      )
    }

    if (paymentProvider === 'PAYPAL') {
      const result = await processPayPalPayment(amount, currency || 'USD', 'Order Payment')
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || 'PayPal payment failed' },
          { status: 400 }
        )
      }

      // For checkout, use the checkout callback URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const checkoutCallbackUrl = new URL(`${baseUrl}/api/checkout/paypal-callback`)
      checkoutCallbackUrl.searchParams.set('orderId', result.orderId || '')
      
      // Store order data as base64 encoded JSON in URL (or use session/database in production)
      if (orderData) {
        const orderDataEncoded = Buffer.from(JSON.stringify(orderData)).toString('base64')
        checkoutCallbackUrl.searchParams.set('orderData', orderDataEncoded)
      }

      // If using mock PayPal, update the redirect URL to include callback
      let finalRedirectUrl = checkoutCallbackUrl.toString()
      if (result.redirectUrl && result.redirectUrl.includes('/api/payments/paypal/mock')) {
        // For mock payments, redirect to mock page but with checkout callback
        const mockUrl = new URL(result.redirectUrl)
        mockUrl.searchParams.set('callback', checkoutCallbackUrl.toString())
        mockUrl.searchParams.set('orderId', result.orderId || '')
        if (orderData) {
          const orderDataEncoded = Buffer.from(JSON.stringify(orderData)).toString('base64')
          mockUrl.searchParams.set('orderData', orderDataEncoded)
        }
        finalRedirectUrl = mockUrl.toString()
      }

      return NextResponse.json({
        success: true,
        transactionId: result.transactionId,
        orderId: result.orderId,
        redirectUrl: finalRedirectUrl,
        message: 'PayPal payment initiated'
      })
    }

    if (paymentProvider === 'IOTEC_MTN' || paymentProvider === 'IOTEC_AIRTEL') {
      if (!phoneNumber) {
        return NextResponse.json(
          { success: false, error: 'Phone number is required for mobile money payment' },
          { status: 400 }
        )
      }

      const provider = paymentProvider === 'IOTEC_MTN' ? 'MTN' : 'AIRTEL'
      const externalId = `gocart_order_${userId}_${Date.now()}`
      const result = await processIotecPayment(
        amount, 
        phoneNumber, 
        provider, 
        currency === 'UGX' ? 'UGX' : 'ITX', 
        'Order Payment',
        externalId
      )
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || 'Iotec payment failed' },
          { status: 400 }
        )
      }

      // For mobile money, the payment is initiated but status is Pending
      // The user needs to approve the payment on their phone
      // The frontend should poll the status until it becomes Success or Failed

      return NextResponse.json({
        success: true,
        transactionId: result.transactionId,
        externalId: result.externalId,
        status: result.status || 'Pending',
        pending: result.status === 'Pending' || result.status === 'SentToVendor' || result.status === 'AwaitingApproval',
        message: result.status === 'Success' 
          ? 'Payment processed successfully' 
          : 'Payment initiated. Please approve the prompt on your phone to complete the payment.'
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid payment provider' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error processing payment:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process payment' },
      { status: 500 }
    )
  }
}

