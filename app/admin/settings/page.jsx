'use client'
import { useEffect, useState } from "react"
import Loading from "@/components/Loading"
import toast from "react-hot-toast"
import { SettingsIcon } from "lucide-react"

export default function AdminSettings() {
    const [currencies, setCurrencies] = useState([])
    const [defaultCurrency, setDefaultCurrency] = useState(null)
    const [languages, setLanguages] = useState([])
    const [defaultLanguage, setDefaultLanguage] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchCurrencies = async () => {
        try {
            const response = await fetch('/api/currencies')
            const result = await response.json()
            if (result.success) {
                setCurrencies(result.data)
            }
        } catch (error) {
            console.error('Error fetching currencies:', error)
            toast.error('Failed to fetch currencies')
        }
    }

    const fetchDefaultCurrency = async () => {
        try {
            const response = await fetch('/api/settings/default-currency')
            const result = await response.json()
            if (result.success) {
                setDefaultCurrency(result.data)
            }
        } catch (error) {
            console.error('Error fetching default currency:', error)
        }
    }

    const fetchLanguages = async () => {
        try {
            const response = await fetch('/api/languages')
            const result = await response.json()
            if (result.success) {
                setLanguages(result.data)
            }
        } catch (error) {
            console.error('Error fetching languages:', error)
            toast.error('Failed to fetch languages')
        }
    }

    const fetchDefaultLanguage = async () => {
        try {
            const response = await fetch('/api/settings/default-language')
            const result = await response.json()
            if (result.success) {
                setDefaultLanguage(result.data)
            }
        } catch (error) {
            console.error('Error fetching default language:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateDefaultCurrency = async (currencyId) => {
        try {
            const response = await fetch('/api/settings/default-currency', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ currencyId }),
            })

            const result = await response.json()
            if (result.success) {
                setDefaultCurrency(result.data)
                toast.success(`Default currency updated to ${result.data.code}`)
            } else {
                toast.error(result.error || 'Failed to update default currency')
            }
        } catch (error) {
            console.error('Error updating default currency:', error)
            toast.error('Failed to update default currency')
        }
    }

    const handleUpdateDefaultLanguage = async (languageId) => {
        try {
            const response = await fetch('/api/settings/default-language', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ languageId }),
            })

            const result = await response.json()
            if (result.success) {
                setDefaultLanguage(result.data)
                toast.success(`Default language updated to ${result.data.name}`)
            } else {
                toast.error(result.error || 'Failed to update default language')
            }
        } catch (error) {
            console.error('Error updating default language:', error)
            toast.error('Failed to update default language')
        }
    }

    useEffect(() => {
        fetchCurrencies()
        fetchDefaultCurrency()
        fetchLanguages()
        fetchDefaultLanguage()
    }, [])

    if (loading) return <Loading />

    return (
        <div className="text-slate-500 mb-40">
            <div className="flex items-center gap-3 mb-6">
                <SettingsIcon size={24} className="text-slate-800" />
                <h2 className="text-2xl">
                    Site <span className="text-slate-800 font-medium">Settings</span>
                </h2>
            </div>

            {/* Default Currency Setting */}
            <div className="max-w-2xl bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Default Currency</h3>
                <p className="text-sm text-slate-500 mb-6">
                    Set the default currency that will be used for all users who haven't selected a currency preference.
                </p>

                {defaultCurrency && (
                    <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-600 mb-1">Current Default Currency:</p>
                        <p className="text-lg font-semibold text-slate-800">
                            {defaultCurrency.symbol} {defaultCurrency.name} ({defaultCurrency.code})
                        </p>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Select Default Currency
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {currencies.map((currency) => (
                            <button
                                key={currency.id}
                                onClick={() => handleUpdateDefaultCurrency(currency.id)}
                                className={`p-4 border-2 rounded-lg text-left transition-all ${
                                    defaultCurrency?.id === currency.id
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-slate-800">{currency.name}</p>
                                        <p className="text-sm text-slate-500">{currency.code}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-slate-800">{currency.symbol}</p>
                                        {defaultCurrency?.id === currency.id && (
                                            <p className="text-xs text-green-600 mt-1">Default</p>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Default Language Setting */}
            <div className="max-w-2xl bg-white border border-slate-200 rounded-lg p-6 mt-6">
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Default Language</h3>
                <p className="text-sm text-slate-500 mb-6">
                    Set the default language that will be used for all users who haven't selected a language preference.
                </p>

                {defaultLanguage && (
                    <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-600 mb-1">Current Default Language:</p>
                        <p className="text-lg font-semibold text-slate-800">
                            {defaultLanguage.name} ({defaultLanguage.nativeName})
                        </p>
                        {defaultLanguage.isRTL && (
                            <p className="text-xs text-slate-500 mt-1">Right-to-Left (RTL) layout</p>
                        )}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Select Default Language
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {languages.map((lang) => (
                            <button
                                key={lang.id}
                                onClick={() => handleUpdateDefaultLanguage(lang.id)}
                                className={`p-4 border-2 rounded-lg text-left transition-all ${
                                    defaultLanguage?.id === lang.id
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-slate-800">{lang.name}</p>
                                        <p className="text-sm text-slate-500">{lang.nativeName}</p>
                                        {lang.isRTL && (
                                            <p className="text-xs text-slate-400 mt-1">RTL</p>
                                        )}
                                    </div>
                                    {defaultLanguage?.id === lang.id && (
                                        <p className="text-xs text-green-600">Default</p>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

