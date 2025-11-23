'use client'

import { useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { useDispatch, useSelector } from 'react-redux'
import { loadCart, mergeCart } from '@/lib/features/cart/cartSlice'

/**
 * Component that syncs cart between localStorage and database
 * - Loads cart from database when user signs in
 * - Merges local cart with database cart
 * - Saves cart to database when authenticated user makes changes
 */
export default function CartSync() {
  const { user, isLoaded } = useUser()
  const dispatch = useDispatch()
  const cart = useSelector((state: any) => state.cart)
  const cartItems = cart?.cartItems || {}
  const syncAttemptedRef = useRef(false)
  const lastSavedCartRef = useRef<string>('')

  // Sync cart from database when user signs in
  useEffect(() => {
    if (!isLoaded) return

    if (user && !syncAttemptedRef.current) {
      syncAttemptedRef.current = true
      
      const syncCartFromDatabase = async () => {
        try {
          const response = await fetch('/api/cart', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success && data.cartItems) {
              // Merge database cart with local cart
              dispatch(mergeCart({ cartItems: data.cartItems }))
            }
          }
        } catch (error) {
          console.error('Error syncing cart from database:', error)
        }
      }

      // Small delay to ensure user session is fully established
      const timeoutId = setTimeout(() => {
        syncCartFromDatabase()
      }, 500)

      return () => clearTimeout(timeoutId)
    } else if (!user) {
      // User signed out, reset sync flag
      syncAttemptedRef.current = false
      lastSavedCartRef.current = ''
    }
  }, [user, isLoaded, dispatch])

  // Save cart to database when authenticated user makes changes
  useEffect(() => {
    if (!isLoaded || !user) return

    const cartString = JSON.stringify(cartItems)
    
    // Only save if cart has changed
    if (cartString === lastSavedCartRef.current) return

    // Debounce: wait 1 second after last change before saving
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cartItems }),
        })

        if (response.ok) {
          lastSavedCartRef.current = cartString
        } else {
          console.error('Failed to save cart to database')
        }
      } catch (error) {
        console.error('Error saving cart to database:', error)
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [cartItems, user, isLoaded])

  return null // This component doesn't render anything
}

