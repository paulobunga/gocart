'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch current language on mount
  useEffect(() => {
    fetchCurrentLanguage()
  }, [])

  // Update document direction when language changes
  useEffect(() => {
    if (language) {
      document.documentElement.setAttribute('dir', language.isRTL ? 'rtl' : 'ltr')
      document.documentElement.setAttribute('lang', language.code)
    }
  }, [language])

  const fetchCurrentLanguage = async () => {
    try {
      const response = await fetch('/api/languages/current')
      const result = await response.json()
      if (result.success) {
        setLanguage(result.data)
      } else {
        console.error('Failed to fetch language:', result.error)
        // Fallback to a default language object
        setLanguage({ code: 'en-US', name: 'English (US)', nativeName: 'English', isRTL: false })
      }
    } catch (error) {
      console.error('Error fetching language:', error)
      // Fallback to a default language object
      setLanguage({ code: 'en-US', name: 'English (US)', nativeName: 'English', isRTL: false })
    } finally {
      setLoading(false)
    }
  }

  const switchLanguage = async (languageId) => {
    try {
      const response = await fetch('/api/languages/current', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ languageId }),
      })

      const result = await response.json()
      if (result.success) {
        setLanguage(result.data)
        toast.success(`Language switched to ${result.data.name}`)
        // Refresh the page to update all language displays and RTL layout
        window.location.reload()
      } else {
        toast.error(result.error || 'Failed to switch language')
      }
    } catch (error) {
      console.error('Error switching language:', error)
      toast.error('Failed to switch language')
    }
  }

  const value = {
    language,
    loading,
    switchLanguage,
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}

