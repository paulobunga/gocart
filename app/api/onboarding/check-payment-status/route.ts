import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { pollIotecPaymentStatus, verifyIotecPayment } from '@/lib/payments/iotec'

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
    const { transactionId, paymentProvider } = body

    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    if (paymentProvider === 'IOTEC_MTN' || paymentProvider === 'IOTEC_AIRTEL') {
      // Poll the payment status
      const result = await pollIotecPaymentStatus(transactionId, 60, 2000) // 60 attempts, 2 seconds apart = 2 minutes max

      return NextResponse.json({
        success: result.verified,
        status: result.status,
        verified: result.verified,
        error: result.error,
        message: result.verified 
          ? 'Payment confirmed successfully' 
          : result.error || 'Payment not yet confirmed'
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid payment provider' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error checking payment status:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check payment status' },
      { status: 500 }
    )
  }
}

