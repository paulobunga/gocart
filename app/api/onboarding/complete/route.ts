import { NextRequest, NextResponse } from 'next/server'
import { completeVendorOnboarding } from '../../../(public)/onboarding/_actions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const result = await completeVendorOnboarding(body)
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error in onboarding completion API:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}


