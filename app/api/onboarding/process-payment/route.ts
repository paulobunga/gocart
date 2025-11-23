import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { processPayPalPayment } from '@/lib/payments/paypal'
import { processIotecPayment } from '@/lib/payments/iotec'
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
    const { storeId, plan, billing, paymentProvider, amount, phoneNumber, currency = 'USD' } = body

    if (plan === 'FREE') {
      return NextResponse.json({
        success: true,
        transactionId: 'FREE_PLAN',
        message: 'Free plan selected, no payment required'
      })
    }

    if (!paymentProvider || !amount) {
      return NextResponse.json(
        { success: false, error: 'Payment provider and amount are required' },
        { status: 400 }
      )
    }

    let result

    if (paymentProvider === 'PAYPAL') {
      result = await processPayPalPayment(amount, currency, 'Vendor Subscription')
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || 'PayPal payment failed' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        transactionId: result.transactionId,
        message: 'Payment processed successfully'
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
      const externalId = `gocart_subscription_${userId}_${Date.now()}`
      result = await processIotecPayment(
        amount, 
        phoneNumber, 
        provider, 
        currency || 'UGX', 
        'Vendor Subscription',
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


