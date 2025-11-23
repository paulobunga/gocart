'use client'

import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '@/lib/contexts/LanguageContext'
import { ChevronDownIcon, Globe } from 'lucide-react'

const LanguageSwitcher = () => {
  const { language, switchLanguage } = useLanguage()
  const [languages, setLanguages] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    // Fetch all languages
    const fetchLanguages = async () => {
      try {
        const response = await fetch('/api/languages')
        const result = await response.json()
        if (result.success) {
          setLanguages(result.data)
        }
      } catch (error) {
        console.error('Error fetching languages:', error)
      }
    }

    fetchLanguages()
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

  const handleLanguageChange = async (languageId) => {
    await switchLanguage(languageId)
    setIsOpen(false)
  }

  if (!language) {
    return null
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        aria-label="Change language"
      >
        <Globe size={16} className="text-slate-500" />
        <span className="font-medium">{language.nativeName || language.name}</span>
        <ChevronDownIcon 
          size={14} 
          className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className={`absolute ${language.isRTL ? 'left-0' : 'right-0'} mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto`}>
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.id}
                onClick={() => handleLanguageChange(lang.id)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${
                  language.id === lang.id ? 'bg-slate-100 font-medium' : ''
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-slate-800">{lang.name}</span>
                  <span className="text-xs text-slate-500">{lang.nativeName}</span>
                </div>
                {language.id === lang.id && (
                  <span className="text-green-600 text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default LanguageSwitcher

