'use client'

import { useState, useEffect, useRef } from 'react'
import { useCurrency } from '@/lib/contexts/CurrencyContext'
import { ChevronDownIcon } from 'lucide-react'

const CurrencySwitcher = () => {
  const { currency, switchCurrency } = useCurrency()
  const [currencies, setCurrencies] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    // Fetch all currencies
    const fetchCurrencies = async () => {
      try {
        const response = await fetch('/api/currencies')
        const result = await response.json()
        if (result.success) {
          setCurrencies(result.data)
        }
      } catch (error) {
        console.error('Error fetching currencies:', error)
      }
    }

    fetchCurrencies()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleCurrencyChange = async (currencyId) => {
    await switchCurrency(currencyId)
    setIsOpen(false)
  }

  if (!currency) {
    return null
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        aria-label="Change currency"
      >
        <span className="font-medium">{currency.symbol}</span>
        <span className="text-xs text-slate-500">{currency.code}</span>
        <ChevronDownIcon 
          size={14} 
          className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          <div className="py-1">
            {currencies.map((curr) => (
              <button
                key={curr.id}
                onClick={() => handleCurrencyChange(curr.id)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${
                  currency.id === curr.id ? 'bg-slate-100 font-medium' : ''
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-slate-800">{curr.name}</span>
                  <span className="text-xs text-slate-500">{curr.code}</span>
                </div>
                <span className="text-slate-600 font-medium">{curr.symbol}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default CurrencySwitcher

