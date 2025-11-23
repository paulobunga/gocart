import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const username = searchParams.get('username')

    if (!username || username.length < 3) {
      return NextResponse.json({
        success: false,
        error: 'Username must be at least 3 characters'
      }, { status: 400 })
    }

    // Check if username is taken
    const existingStore = await prisma.store.findUnique({
      where: { username }
    })

    return NextResponse.json({
      success: true,
      available: !existingStore
    })
  } catch (error: any) {
    console.error('Error checking store name:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check store name' },
      { status: 500 }
    )
  }
}


