import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { syncUserToDatabase } from '@/lib/sync-user'
import { clerkClient } from '@clerk/nextjs/server'

export default async function OnboardingLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  try {
    const { sessionClaims, userId } = await auth()
    
    // If user is not authenticated, they shouldn't be here (middleware should handle this)
    if (!userId) {
      return <>{children}</>
    }
    
    // Ensure user exists in database (sync if needed)
    // This prevents issues when webhooks haven't fired yet
    try {
      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      })
      
      if (!existingUser) {
        // User doesn't exist in database, sync them
        try {
          const client = await clerkClient()
          const clerkUser = await client.users.getUser(userId)
          if (clerkUser) {
            await syncUserToDatabase(
              userId,
              clerkUser.emailAddresses[0]?.emailAddress || '',
              clerkUser.firstName,
              clerkUser.lastName,
              clerkUser.imageUrl
            )
          }
        } catch (syncError) {
          // If sync fails, continue anyway - UserSync component will handle it
          console.error('Error syncing user in layout:', syncError)
        }
      }
    } catch (userCheckError) {
      // If user check fails, continue anyway
      console.error('Error checking user in layout:', userCheckError)
    }
    
    // Check both session claims and database to prevent redirect loops
    // Session claims might not be updated immediately after onboarding
    const onboardingCompleteFromClaims = sessionClaims?.metadata?.vendorOnboardingComplete === true
    
    // Also check database directly as a fallback
    let hasStore = false
    try {
      const store = await prisma.store.findUnique({
        where: { userId },
        select: { id: true }
      })
      hasStore = !!store
    } catch (dbError) {
      // If database check fails, don't block access
      console.error('Error checking store in layout:', dbError)
    }
    
    // Only redirect if we're certain onboarding is complete
    // This prevents redirect loops when metadata is undefined/null or not yet synced
    // Be very strict - only redirect if explicitly true and user exists in database
    // Don't redirect if user was just created (they need to complete onboarding)
    if (onboardingCompleteFromClaims === true || hasStore === true) {
      // Double-check user exists before redirecting to avoid loops
      try {
        const userExists = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true }
        })
        
        // Only redirect if user exists and onboarding is complete
        if (userExists && (onboardingCompleteFromClaims === true || hasStore === true)) {
          redirect('/store')
        }
      } catch (redirectCheckError) {
        // If check fails, don't redirect - allow access to onboarding
        console.error('Error checking user before redirect:', redirectCheckError)
      }
    }

    // Allow access to onboarding page
    return <>{children}</>
  } catch (error) {
    // If there's an error reading auth, just render children
    // This prevents redirect loops from auth errors
    console.error('Error in onboarding layout:', error)
    return <>{children}</>
  }
}

