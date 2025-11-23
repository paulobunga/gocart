'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

const CurrencyContext = createContext(null)

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch current currency on mount
  useEffect(() => {
    fetchCurrentCurrency()
  }, [])

  const fetchCurrentCurrency = async () => {
    try {
      const response = await fetch('/api/currencies/current')
      const result = await response.json()
      if (result.success) {
        setCurrency(result.data)
      } else {
        console.error('Failed to fetch currency:', result.error)
        // Fallback to a default currency object
        setCurrency({ code: 'UGX', symbol: 'USh', exchangeRate: 1.0 })
      }
    } catch (error) {
      console.error('Error fetching currency:', error)
      // Fallback to a default currency object
      setCurrency({ code: 'UGX', symbol: 'USh', exchangeRate: 1.0 })
    } finally {
      setLoading(false)
    }
  }

  const switchCurrency = async (currencyId) => {
    try {
      const response = await fetch('/api/currencies/current', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currencyId }),
      })

      const result = await response.json()
      if (result.success) {
        setCurrency(result.data)
        toast.success(`Currency switched to ${result.data.code}`)
        // Currency state update will trigger re-render of all components using useCurrency()
      } else {
        toast.error(result.error || 'Failed to switch currency')
      }
    } catch (error) {
      console.error('Error switching currency:', error)
      toast.error('Failed to switch currency')
    }
  }

  const formatPrice = (price) => {
    if (!currency) return `$${price}`
    const convertedPrice = price * currency.exchangeRate
    return `${currency.symbol}${convertedPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
  }

  const value = {
    currency,
    loading,
    switchCurrency,
    formatPrice,
  }

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider')
  }
  return context
}

