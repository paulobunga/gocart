'use client'

import { useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'

/**
 * Component that syncs Clerk users to the database
 * Runs once when user is authenticated
 * Handles social auth redirects and retries on failure
 */
export default function UserSync() {
  const { user, isLoaded } = useUser()
  const syncAttemptedRef = useRef(false)
  const syncInProgressRef = useRef(false)

  useEffect(() => {
    if (!isLoaded || !user) return

    // Prevent multiple simultaneous sync attempts
    if (syncInProgressRef.current) return

    // Check if we've already attempted sync in this component instance
    // This prevents multiple sync attempts on re-renders
    if (syncAttemptedRef.current) {
      return
    }

    // Check sessionStorage as a hint, but don't rely on it completely
    // After social auth redirects, sessionStorage might be cleared
    const storageKey = `user_synced_${user.id}`
    const hasSyncedInStorage = sessionStorage.getItem(storageKey)
    
    // If we've synced recently (within last 5 minutes), skip
    // This prevents unnecessary API calls while still allowing sync after redirects
    if (hasSyncedInStorage) {
      const syncTimestamp = sessionStorage.getItem(`${storageKey}_timestamp`)
      if (syncTimestamp) {
        const timeSinceSync = Date.now() - parseInt(syncTimestamp, 10)
        // If synced within last 5 minutes, skip
        if (timeSinceSync < 5 * 60 * 1000) {
          return
        }
      }
    }

    // Sync user to database
    const syncUser = async (retryCount = 0) => {
      // Prevent concurrent sync attempts
      if (syncInProgressRef.current) return
      syncInProgressRef.current = true
      syncAttemptedRef.current = true

      try {
        const response = await fetch('/api/users/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            console.log('User synced to database successfully')
            // Mark as synced in sessionStorage
            sessionStorage.setItem(storageKey, 'true')
            // Also store timestamp for debugging
            sessionStorage.setItem(`${storageKey}_timestamp`, Date.now().toString())
          } else {
            throw new Error(data.error || 'Sync failed')
          }
        } else {
          // If unauthorized, user might not be fully authenticated yet
          // Retry after a short delay
          if (response.status === 401 && retryCount < 3) {
            console.log(`Sync failed with 401, retrying... (${retryCount + 1}/3)`)
            syncInProgressRef.current = false
            setTimeout(() => {
              syncUser(retryCount + 1)
            }, 1000 * (retryCount + 1)) // Exponential backoff
            return
          }
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }
      } catch (error) {
        console.error('Error syncing user:', error)
        
        // Retry on network errors or if user might not be ready yet
        if (retryCount < 3 && (
          error instanceof TypeError || // Network error
          error.message?.includes('401') ||
          error.message?.includes('Unauthorized')
        )) {
          console.log(`Retrying user sync... (${retryCount + 1}/3)`)
          syncInProgressRef.current = false
          setTimeout(() => {
            syncUser(retryCount + 1)
          }, 1000 * (retryCount + 1)) // Exponential backoff
          return
        }
        
        // If all retries failed, log but don't disrupt user experience
        console.warn('User sync failed after retries. User may need to refresh the page.')
      } finally {
        syncInProgressRef.current = false
      }
    }

    // Small delay to ensure Clerk session is fully established
    // This is especially important after social auth redirects
    const timeoutId = setTimeout(() => {
      syncUser()
    }, 500)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [user, isLoaded])

  return null // This component doesn't render anything
}

