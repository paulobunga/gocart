'use client'
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { MapPin } from 'lucide-react'

const CurrentAddress = () => {
  const { user, isLoaded } = useUser()
  const [currentAddress, setCurrentAddress] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCurrentAddress = async () => {
      if (!isLoaded) {
        setLoading(false)
        return
      }

      // If user is signed in, try to get address from database first
      if (user) {
        try {
          const response = await fetch('/api/addresses')
          const result = await response.json()
          
          if (result.success && result.data && result.data.length > 0) {
            // Get the first address (most recent by default)
            const address = result.data[0]
            setCurrentAddress({
              city: address.city,
              country: address.country,
              source: 'database'
            })
            setLoading(false)
            return
          }
        } catch (error) {
          console.error('Error fetching address from database:', error)
        }
      }

      // Fallback to IP-based geolocation if no address in database
      try {
        const response = await fetch('/api/location/ip')
        const result = await response.json()
        
        if (result.success && result.data) {
          setCurrentAddress({
            city: result.data.city,
            country: result.data.country,
            source: 'ip'
          })
        }
      } catch (error) {
        console.error('Error fetching location from IP:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCurrentAddress()
  }, [isLoaded, user])

  if (loading || !currentAddress) {
    return null
  }

  return (
    <div className="flex items-center gap-1.5 text-sm text-slate-600">
      <MapPin size={14} className="text-slate-500" />
      <span className="truncate max-w-[200px]">
        {currentAddress.city}, {currentAddress.country}
      </span>
    </div>
  )
}

export default CurrentAddress

