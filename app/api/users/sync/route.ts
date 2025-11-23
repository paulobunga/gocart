import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { syncUserToDatabase } from '@/lib/sync-user'

/**
 * API endpoint to sync the current user to the database
 * This is a fallback for when webhooks aren't available
 * Call this after sign-in/sign-up to ensure user exists in database
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

    // Get user data from Clerk
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)
    
    if (!clerkUser) {
      return NextResponse.json(
        { success: false, error: 'User not found in Clerk' },
        { status: 404 }
      )
    }

    // Sync user to database
    const user = await syncUserToDatabase(
      userId,
      clerkUser.emailAddresses[0]?.emailAddress || '',
      clerkUser.firstName,
      clerkUser.lastName,
      clerkUser.imageUrl
    )

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User synced to database'
    })
  } catch (error: any) {
    console.error('Error syncing user:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to sync user' },
      { status: 500 }
    )
  }
}

