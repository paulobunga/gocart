'use client'
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Check, ChevronRight, ChevronLeft, Upload, CreditCard, Building2, User, Loader2, AlertCircle, XCircle } from 'lucide-react'
import Image from 'next/image'
import { useCurrency } from '@/lib/contexts/CurrencyContext'

// Plans will be loaded from database

export default function OnboardingPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const { currency, formatPrice, loading: currencyLoading } = useCurrency()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState(null) // 'processing', 'success', 'error'
  const [paymentMessage, setPaymentMessage] = useState('')
  const [checkingName, setCheckingName] = useState(false)
  const [nameAvailable, setNameAvailable] = useState(null)
  const [usernameManuallyEdited, setUsernameManuallyEdited] = useState(false)
  const [plans, setPlans] = useState(null)
  const [loadingPlans, setLoadingPlans] = useState(true)
  
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: '',
    lastName: '',
    phone: '',
    
    // Business Info
    storeName: '',
    storeUsername: '',
    businessEmail: '',
    businessPhone: '',
    businessAddress: '',
    description: '',
    logo: null,
    logoPreview: '',
    
    // Plan Selection
    plan: 'FREE',
    billing: 'MONTHLY',
    
    // Payment
    paymentProvider: '',
    paymentTransactionId: '',
    phoneNumber: '',
    phoneNumber: '' // For mobile money payments
  })

  // Fetch subscription plans from database
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/subscription-plans')
        const result = await response.json()
        if (result.success) {
          // Convert array to object keyed by type for easy access
          const plansObj = result.data.reduce((acc, plan) => {
            acc[plan.type] = plan
            return acc
          }, {})
          setPlans(plansObj)
          // Set default plan to FREE if available
          if (plansObj.FREE && !formData.plan) {
            setFormData(prev => ({ ...prev, plan: 'FREE' }))
          }
        } else {
          console.error('Failed to fetch plans:', result.error)
        }
      } catch (error) {
        console.error('Error fetching plans:', error)
      } finally {
        setLoadingPlans(false)
      }
    }

    fetchPlans()
  }, [])

  useEffect(() => {
    if (isLoaded && user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        businessEmail: user.emailAddresses[0]?.emailAddress || ''
      }))
    }
  }, [user, isLoaded])

  // Clean up Clerk redirect parameters from URL after authentication
  useEffect(() => {
    if (typeof window !== 'undefined' && isLoaded) {
      const url = new URL(window.location.href)
      const hasClerkParams = url.searchParams.has('__clerk_db_jwt') || 
                            url.searchParams.has('__clerk_redirect_url') ||
                            url.searchParams.has('__clerk_synced')
      
      if (hasClerkParams) {
        // Remove Clerk params from URL
        url.searchParams.delete('__clerk_db_jwt')
        url.searchParams.delete('__clerk_redirect_url')
        url.searchParams.delete('__clerk_synced')
        
        // Replace URL without Clerk params (without page reload)
        window.history.replaceState({}, '', url.toString())
      }
    }
  }, [isLoaded])

  // Handle payment errors/cancellations from URL parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      const paymentStatus = url.searchParams.get('payment')
      const error = url.searchParams.get('error')
      
      if (paymentStatus === 'cancelled') {
        toast.error('Payment was cancelled. Please try again to complete your onboarding.')
        // Clean up URL
        url.searchParams.delete('payment')
        window.history.replaceState({}, '', url.toString())
      } else if (paymentStatus === 'failed') {
        toast.error('Payment verification failed. Please try again or contact support.')
        url.searchParams.delete('payment')
        window.history.replaceState({}, '', url.toString())
      } else if (paymentStatus === 'error') {
        toast.error(error || 'An error occurred during payment processing. Please try again.')
        url.searchParams.delete('payment')
        url.searchParams.delete('error')
        window.history.replaceState({}, '', url.toString())
      }
    }
  }, [])

  // Don't redirect here - let middleware handle authentication
  // This prevents redirect loops during sign-up flow

  // Generate slug from store name
  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
  }

  // Get subscription plans with converted prices based on current currency
  const getSubscriptionPlans = () => {
    if (!plans) return {}
    if (!currency) return plans
    
    return Object.keys(plans).reduce((acc, key) => {
      const plan = plans[key]
      const planCurrency = plan.currency
      
      // Convert from plan's currency to user's selected currency
      // If plan currency and user currency are the same, no conversion needed
      // Otherwise, convert: userPrice = planPrice * (userExchangeRate / planExchangeRate)
      const planExchangeRate = planCurrency?.exchangeRate || 1
      const userExchangeRate = currency?.exchangeRate || 1
      const conversionRate = planExchangeRate > 0 
        ? userExchangeRate / planExchangeRate
        : 1
      
      // Ensure prices are numbers
      const monthlyPrice = Number(plan.monthlyPrice) || 0
      const annualPrice = Number(plan.annualPrice) || 0
      
      acc[key] = {
        ...plan,
        // Add converted prices
        monthlyPrice: monthlyPrice * conversionRate,
        annualPrice: annualPrice * conversionRate,
        // Keep original prices for reference
        originalMonthlyPrice: monthlyPrice,
        originalAnnualPrice: annualPrice,
        planCurrency: planCurrency
      }
      return acc
    }, {})
  }

  const SUBSCRIPTION_PLANS = getSubscriptionPlans()

  const checkStoreName = async (username) => {
    if (!username || username.length < 3) {
      setNameAvailable(null)
      return
    }

    setCheckingName(true)
    try {
      const response = await fetch(`/api/onboarding/check-name?username=${encodeURIComponent(username)}`)
      const data = await response.json()
      if (data.success) {
        setNameAvailable(data.available)
        if (!data.available) {
          toast.error('Store name is already taken')
        }
      } else {
        toast.error(data.error || 'Error checking store name')
      }
    } catch (error) {
      console.error('Error checking store name:', error)
      toast.error('Error checking store name')
    } finally {
      setCheckingName(false)
    }
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Logo must be less than 5MB')
        return
      }
      setFormData(prev => ({
        ...prev,
        logo: file,
        logoPreview: URL.createObjectURL(file)
      }))
    }
  }

  const uploadLogo = async () => {
    if (!formData.logo) return ''

    const formDataToSend = new FormData()
    formDataToSend.append('logo', formData.logo)

    try {
      const response = await fetch('/api/onboarding/upload-logo', {
        method: 'POST',
        body: formDataToSend
      })
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      if (data.success) {
        return data.url
      }
      throw new Error(data.error || 'Failed to upload logo')
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast.error(error.message || 'Failed to upload logo')
      throw error
    }
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!formData.firstName || !formData.lastName || !formData.phone) {
        toast.error('Please fill in all personal information fields')
        return
      }
    } else if (currentStep === 2) {
      if (!formData.storeName || !formData.storeUsername || !formData.businessEmail || !formData.businessPhone || !formData.businessAddress) {
        toast.error('Please fill in all business information fields')
        return
      }
      if (nameAvailable !== true) {
        toast.error('Please choose an available store name')
        return
      }
    } else if (currentStep === 3) {
      if (!formData.plan) {
        toast.error('Please select a subscription plan')
        return
      }
    } else if (currentStep === 4) {
      // Only require payment provider for paid plans
      // Check if plan is FREE by type or by price
      const selectedPlan = SUBSCRIPTION_PLANS?.[formData.plan]
      const isFreePlan = formData.plan === 'FREE' || 
                        formData.plan?.toUpperCase() === 'FREE' ||
                        (selectedPlan && (selectedPlan.monthlyPrice === 0 || selectedPlan.originalMonthlyPrice === 0))
      
      if (!isFreePlan && !formData.paymentProvider) {
        toast.error('Please select a payment method')
        return
      }
    }

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setProcessingPayment(false)
    setPaymentStatus(null)
    setPaymentMessage('')
    
    try {
      // Upload logo first
      let logoUrl = ''
      if (formData.logo) {
        logoUrl = await uploadLogo()
      }

      // Check if this is a free plan or paid plan
      const selectedPlan = SUBSCRIPTION_PLANS?.[formData.plan]
      const isFreePlan = formData.plan === 'FREE' || 
                        formData.plan?.toUpperCase() === 'FREE' ||
                        (selectedPlan && (selectedPlan.monthlyPrice === 0 || selectedPlan.originalMonthlyPrice === 0))

      // For free plans, complete onboarding directly
      if (isFreePlan) {
        setPaymentStatus('processing')
        setPaymentMessage('Completing onboarding...')
        
        const response = await fetch('/api/onboarding/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            logo: logoUrl,
            paymentProvider: '',
            paymentTransactionId: 'FREE_PLAN'
          })
        })

        const data = await response.json()
        if (data.success) {
          setPaymentStatus('success')
          setPaymentMessage('Onboarding completed successfully!')
          await user?.reload()
          setTimeout(() => {
            router.push(`/onboarding/confirmation?storeId=${data.storeId}`)
          }, 1500)
        } else {
          throw new Error(data.error || 'Failed to complete onboarding')
        }
      } else {
        // For paid plans: Process payment FIRST, then complete onboarding only on success
        if (formData.paymentProvider === 'PAYPAL') {
          setProcessingPayment(true)
          setPaymentStatus('processing')
          setPaymentMessage('Initiating PayPal payment...')
          
          // Store form data temporarily (we'll use it in the callback)
          // Initiate PayPal payment and get redirect URL with form data
          const paymentResponse = await fetch('/api/onboarding/initiate-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              plan: formData.plan,
              billing: formData.billing,
              paymentProvider: formData.paymentProvider,
              amount: formData.billing === 'MONTHLY' 
                ? (SUBSCRIPTION_PLANS[formData.plan]?.monthlyPrice || 0)
                : (SUBSCRIPTION_PLANS[formData.plan]?.annualPrice || 0),
              currency: currency?.code || 'USD',
              // Include form data for onboarding completion after payment
              formData: {
                ...formData,
                logo: logoUrl
              }
            })
          })

          const paymentData = await paymentResponse.json()
          if (!paymentData.success) {
            setPaymentStatus('error')
            setPaymentMessage(paymentData.error || 'Failed to initiate payment')
            throw new Error(paymentData.error || 'Failed to initiate payment')
          }

          setPaymentMessage('Redirecting to PayPal...')
          // Redirect to PayPal - onboarding will complete in callback
          if (paymentData.redirectUrl) {
            setTimeout(() => {
              window.location.href = paymentData.redirectUrl
            }, 1000)
          } else {
            setPaymentStatus('error')
            setPaymentMessage('No redirect URL received from PayPal')
            throw new Error('No redirect URL received from PayPal')
          }
        } else if (formData.paymentProvider === 'IOTEC_MTN' || formData.paymentProvider === 'IOTEC_AIRTEL') {
          setProcessingPayment(true)
          setPaymentStatus('processing')
          setPaymentMessage('Initiating mobile money payment...')
          
          // Step 1: Initiate payment collection request
          const paymentResponse = await fetch('/api/onboarding/process-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              plan: formData.plan,
              billing: formData.billing,
              paymentProvider: formData.paymentProvider,
              amount: formData.billing === 'MONTHLY' 
                ? (SUBSCRIPTION_PLANS[formData.plan]?.monthlyPrice || 0)
                : (SUBSCRIPTION_PLANS[formData.plan]?.annualPrice || 0),
              phoneNumber: formData.phoneNumber,
              currency: currency?.code === 'UGX' ? 'UGX' : 'ITX',
            })
          })

          const paymentData = await paymentResponse.json()
          if (!paymentData.success) {
            setPaymentStatus('error')
            setPaymentMessage(paymentData.error || 'Payment processing failed')
            throw new Error(paymentData.error || 'Payment processing failed')
          }

          // Step 2: If payment is pending, poll for status until confirmed
          if (paymentData.pending || paymentData.status === 'Pending' || paymentData.status === 'SentToVendor' || paymentData.status === 'AwaitingApproval') {
            setPaymentMessage('Payment request sent. Please approve the prompt on your phone...')
            
            // Poll payment status until confirmed or failed
            let paymentConfirmed = false
            let pollAttempts = 0
            const maxPollAttempts = 60 // 2 minutes max (60 * 2 seconds)
            
            while (!paymentConfirmed && pollAttempts < maxPollAttempts) {
              await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds between polls
              
              const statusResponse = await fetch('/api/onboarding/check-payment-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  transactionId: paymentData.transactionId,
                  paymentProvider: formData.paymentProvider
                })
              })

              const statusData = await statusResponse.json()
              
              if (statusData.verified && statusData.status === 'Success') {
                paymentConfirmed = true
                setPaymentMessage('Payment confirmed! Completing onboarding...')
                break
              } else if (statusData.status === 'Failed' || statusData.status === 'RolledBack') {
                setPaymentStatus('error')
                setPaymentMessage(statusData.error || 'Payment was declined or failed. Please try again.')
                throw new Error(statusData.error || 'Payment failed')
              }
              
              pollAttempts++
              
              // Update message periodically to show we're still waiting
              if (pollAttempts % 10 === 0) {
                setPaymentMessage(`Waiting for payment confirmation... (${pollAttempts * 2}s)`)
              }
            }

            if (!paymentConfirmed) {
              setPaymentStatus('error')
              setPaymentMessage('Payment confirmation timeout. Please check your phone and try again.')
              throw new Error('Payment confirmation timeout')
            }
          } else if (paymentData.status !== 'Success') {
            // Payment failed immediately
            setPaymentStatus('error')
            setPaymentMessage(paymentData.error || 'Payment failed')
            throw new Error(paymentData.error || 'Payment failed')
          }

          // Step 3: Payment confirmed, complete onboarding
          setPaymentMessage('Payment confirmed! Completing onboarding...')
          
          const onboardingResponse = await fetch('/api/onboarding/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...formData,
              logo: logoUrl,
              paymentProvider: formData.paymentProvider,
              paymentTransactionId: paymentData.transactionId
            })
          })

          const onboardingData = await onboardingResponse.json()
          if (!onboardingData.success) {
            setPaymentStatus('error')
            setPaymentMessage(onboardingData.error || 'Failed to complete onboarding')
            throw new Error(onboardingData.error || 'Failed to complete onboarding')
          }

          setPaymentStatus('success')
          setPaymentMessage('Payment successful! Onboarding completed.')
          await user?.reload()
          
          setTimeout(() => {
            router.push(`/onboarding/confirmation?storeId=${onboardingData.storeId}&payment=success`)
          }, 1500)
        } else {
          setPaymentStatus('error')
          setPaymentMessage('Invalid payment provider')
          throw new Error('Invalid payment provider')
        }
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      setPaymentStatus('error')
      setPaymentMessage(error.message || 'Failed to complete onboarding')
      toast.error(error.message || 'Failed to complete onboarding')
      setLoading(false)
      setProcessingPayment(false)
    }
  }

  const steps = [
    { number: 1, title: 'Personal Info', icon: User },
    { number: 2, title: 'Business Info', icon: Building2 },
    { number: 3, title: 'Select Plan', icon: CreditCard },
    { number: 4, title: 'Payment', icon: CreditCard },
    { number: 5, title: 'Review', icon: Check }
  ]

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.number
              const isCompleted = currentStep > step.number
              
              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition ${
                      isCompleted ? 'bg-green-500 border-green-500 text-white' :
                      isActive ? 'bg-indigo-500 border-indigo-500 text-white' :
                      'bg-white border-slate-300 text-slate-400'
                    }`}>
                      {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                    </div>
                    <span className={`mt-2 text-sm font-medium ${
                      isActive ? 'text-indigo-600' : 'text-slate-500'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 ${
                      isCompleted ? 'bg-green-500' : 'bg-slate-300'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800">Personal Information</h2>
              <p className="text-slate-600">Tell us about yourself</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="+1234567890"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Business Info */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800">Business Information</h2>
              <p className="text-slate-600">Tell us about your business</p>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Store Logo</label>
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center overflow-hidden">
                    {formData.logoPreview ? (
                      <Image src={formData.logoPreview} alt="Logo preview" width={96} height={96} className="object-cover" />
                    ) : (
                      <Upload size={24} className="text-slate-400" />
                    )}
                  </div>
                  <label className="px-4 py-2 bg-indigo-500 text-white rounded-lg cursor-pointer hover:bg-indigo-600 transition">
                    Upload Logo
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Store Name</label>
                <input
                  type="text"
                  value={formData.storeName}
                  onChange={(e) => {
                    const newName = e.target.value
                    
                    // Auto-generate username from store name if not manually edited
                    if (!usernameManuallyEdited && newName) {
                      const slug = generateSlug(newName)
                      setFormData(prev => ({ ...prev, storeName: newName, storeUsername: slug }))
                      if (slug.length >= 3) {
                        checkStoreName(slug)
                      }
                    } else {
                      setFormData(prev => ({ ...prev, storeName: newName }))
                    }
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="My Awesome Store"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Store Username (URL)
                  <span className="text-xs text-slate-500 font-normal ml-2">(Auto-generated, you can edit)</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">gocart.com/shop/</span>
                  <input
                    type="text"
                    value={formData.storeUsername}
                    onChange={(e) => {
                      const username = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                      setFormData({ ...formData, storeUsername: username })
                      setUsernameManuallyEdited(true)
                      if (username.length >= 3) {
                        checkStoreName(username)
                      }
                    }}
                    onFocus={() => setUsernameManuallyEdited(true)}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="my-awesome-store"
                    required
                  />
                  {checkingName && <span className="text-sm text-slate-500">Checking...</span>}
                  {nameAvailable === true && <Check className="text-green-500" size={20} />}
                  {nameAvailable === false && <span className="text-sm text-red-500">Taken</span>}
                </div>
                {!usernameManuallyEdited && formData.storeName && (
                  <p className="text-xs text-slate-500 mt-1">
                    Username will be auto-generated from your store name
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Business Email</label>
                <input
                  type="email"
                  value={formData.businessEmail}
                  onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Business Phone</label>
                <input
                  type="tel"
                  value={formData.businessPhone}
                  onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Business Address</label>
                <textarea
                  value={formData.businessAddress}
                  onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={4}
                  placeholder="Tell us about your business..."
                />
              </div>
            </div>
          )}

          {/* Step 3: Plan Selection */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800">Select Your Plan</h2>
              <p className="text-slate-600">Choose the subscription plan that fits your needs</p>
              
              <div className="flex justify-center mb-6">
                <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, billing: 'MONTHLY' })}
                    className={`px-6 py-2 rounded-md transition ${
                      formData.billing === 'MONTHLY' 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-slate-600'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, billing: 'ANNUAL' })}
                    className={`px-6 py-2 rounded-md transition ${
                      formData.billing === 'ANNUAL' 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-slate-600'
                    }`}
                  >
                    Annual <span className="text-xs text-green-600">(Save 20%)</span>
                  </button>
                </div>
              </div>

              {loadingPlans ? (
                <div className="text-center py-8">
                  <p className="text-slate-600">Loading plans...</p>
                </div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
                  <div
                    key={key}
                    onClick={() => setFormData({ ...formData, plan: key })}
                    className={`border-2 rounded-lg p-6 cursor-pointer transition ${
                      formData.plan === key
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-slate-800">{plan.name}</h3>
                      {formData.plan === key && <Check className="text-indigo-500" size={20} />}
                    </div>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-slate-800">
                        {formatPrice && plan.originalMonthlyPrice !== undefined 
                          ? formatPrice(formData.billing === 'MONTHLY' ? plan.originalMonthlyPrice : plan.originalAnnualPrice)
                          : plan.planCurrency 
                            ? `${plan.planCurrency.symbol}${(formData.billing === 'MONTHLY' ? plan.monthlyPrice : plan.annualPrice).toLocaleString()}`
                            : `$${formData.billing === 'MONTHLY' ? plan.monthlyPrice : plan.annualPrice}`}
                      </span>
                      <span className="text-slate-600">
                        /{formData.billing === 'MONTHLY' ? 'month' : 'year'}
                      </span>
                    </div>
                    <ul className="space-y-2 mb-4">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                          <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}

          {/* Step 4: Payment */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800">Payment</h2>
              <p className="text-slate-600">Select your payment method</p>
              
              {(() => {
                const selectedPlan = SUBSCRIPTION_PLANS?.[formData.plan]
                const isFreePlan = formData.plan === 'FREE' || 
                                  formData.plan?.toUpperCase() === 'FREE' ||
                                  (selectedPlan && (selectedPlan.monthlyPrice === 0 || selectedPlan.originalMonthlyPrice === 0))
                return isFreePlan
              })() ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <p className="text-lg font-medium text-green-800">Free Plan Selected</p>
                  <p className="text-green-600 mt-2">No payment required. Click continue to proceed.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <p className="text-2xl font-bold text-slate-800">
                      {SUBSCRIPTION_PLANS[formData.plan] && currency
                        ? `${currency.symbol}${(formData.billing === 'MONTHLY' 
                            ? SUBSCRIPTION_PLANS[formData.plan].monthlyPrice 
                            : SUBSCRIPTION_PLANS[formData.plan].annualPrice).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                        : SUBSCRIPTION_PLANS[formData.plan]
                          ? `${SUBSCRIPTION_PLANS[formData.plan].planCurrency?.symbol || '$'}${(formData.billing === 'MONTHLY' 
                              ? SUBSCRIPTION_PLANS[formData.plan].originalMonthlyPrice 
                              : SUBSCRIPTION_PLANS[formData.plan].originalAnnualPrice).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                          : '$0'}
                    </p>
                    <p className="text-slate-600">
                      {formData.billing === 'MONTHLY' ? 'per month' : 'per year'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentProvider: 'PAYPAL' })}
                      className={`border-2 rounded-lg p-6 text-left transition ${
                        formData.paymentProvider === 'PAYPAL'
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-800">PayPal</span>
                        {formData.paymentProvider === 'PAYPAL' && <Check className="text-indigo-500" size={20} />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentProvider: 'IOTEC_MTN' })}
                      className={`border-2 rounded-lg p-6 text-left transition ${
                        formData.paymentProvider === 'IOTEC_MTN'
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-800">Iotec - MTN</span>
                        {formData.paymentProvider === 'IOTEC_MTN' && <Check className="text-indigo-500" size={20} />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentProvider: 'IOTEC_AIRTEL' })}
                      className={`border-2 rounded-lg p-6 text-left transition ${
                        formData.paymentProvider === 'IOTEC_AIRTEL'
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-800">Iotec - Airtel</span>
                        {formData.paymentProvider === 'IOTEC_AIRTEL' && <Check className="text-indigo-500" size={20} />}
                      </div>
                    </button>
                  </div>

                  {/* Phone number input for mobile money */}
                  {(formData.paymentProvider === 'IOTEC_MTN' || formData.paymentProvider === 'IOTEC_AIRTEL') && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Phone Number (for mobile money payment)
                      </label>
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="+256700000000"
                        required
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Enter your {formData.paymentProvider === 'IOTEC_MTN' ? 'MTN' : 'Airtel'} mobile money number
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="space-y-6">
              {processingPayment || paymentStatus ? (
                <div className="space-y-6">
                  <div className="flex flex-col items-center justify-center py-8">
                    {paymentStatus === 'processing' && (
                      <>
                        <Loader2 className="text-indigo-500 animate-spin mb-4" size={48} />
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Processing Payment</h2>
                        <p className="text-slate-600 text-center">{paymentMessage || 'Please wait while we process your payment...'}</p>
                        <div className="mt-4 w-full max-w-md">
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 animate-pulse" style={{ width: '60%' }}></div>
                          </div>
                        </div>
                      </>
                    )}
                    {paymentStatus === 'success' && (
                      <>
                        <CheckCircle className="text-green-500 mb-4" size={48} />
                        <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
                        <p className="text-slate-600 text-center">{paymentMessage || 'Your payment has been processed successfully.'}</p>
                        <p className="text-sm text-slate-500 mt-4">Redirecting to confirmation page...</p>
                      </>
                    )}
                    {paymentStatus === 'error' && (
                      <>
                        <XCircle className="text-red-500 mb-4" size={48} />
                        <h2 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h2>
                        <p className="text-slate-600 text-center mb-4">{paymentMessage || 'An error occurred while processing your payment.'}</p>
                        <button
                          onClick={() => {
                            setProcessingPayment(false)
                            setPaymentStatus(null)
                            setPaymentMessage('')
                            setLoading(false)
                          }}
                          className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
                        >
                          Try Again
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-slate-800">Review Your Information</h2>
                  <p className="text-slate-600">Please review all information before submitting</p>
                  
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h3 className="font-semibold text-slate-800 mb-2">Personal Information</h3>
                      <p className="text-slate-600">Name: {formData.firstName} {formData.lastName}</p>
                      <p className="text-slate-600">Phone: {formData.phone}</p>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4">
                      <h3 className="font-semibold text-slate-800 mb-2">Business Information</h3>
                      <p className="text-slate-600">Store Name: {formData.storeName}</p>
                      <p className="text-slate-600">Username: {formData.storeUsername}</p>
                      <p className="text-slate-600">Email: {formData.businessEmail}</p>
                      <p className="text-slate-600">Phone: {formData.businessPhone}</p>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4">
                      <h3 className="font-semibold text-slate-800 mb-2">Subscription Plan</h3>
                      <p className="text-slate-600">Plan: {SUBSCRIPTION_PLANS[formData.plan].name}</p>
                      <p className="text-slate-600">Billing: {formData.billing}</p>
                      <p className="text-slate-600">
                        Price: {SUBSCRIPTION_PLANS[formData.plan] ? (
                            formatPrice && currency && SUBSCRIPTION_PLANS[formData.plan].planCurrency
                              ? (() => {
                                  const planPrice = formData.billing === 'MONTHLY' 
                                    ? SUBSCRIPTION_PLANS[formData.plan].originalMonthlyPrice
                                    : SUBSCRIPTION_PLANS[formData.plan].originalAnnualPrice
                                  const planCurrency = SUBSCRIPTION_PLANS[formData.plan].planCurrency
                                  const priceInUSD = planCurrency.exchangeRate > 0 ? planPrice / planCurrency.exchangeRate : planPrice
                                  return formatPrice(priceInUSD)
                                })()
                              : `${SUBSCRIPTION_PLANS[formData.plan].planCurrency?.symbol || '$'}${(formData.billing === 'MONTHLY' 
                                  ? SUBSCRIPTION_PLANS[formData.plan].monthlyPrice 
                                  : SUBSCRIPTION_PLANS[formData.plan].annualPrice).toLocaleString()}`
                          ) : '$0'}
                        /{formData.billing === 'MONTHLY' ? 'month' : 'year'}
                      </p>
                      {formData.paymentProvider && (
                        <p className="text-slate-600">Payment: {formData.paymentProvider.replace('_', ' ')}</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ChevronLeft size={18} />
              Back
            </button>
            
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition flex items-center gap-2"
              >
                Next
                <ChevronRight size={18} />
              </button>
            ) : (
              !processingPayment && !paymentStatus && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Complete Onboarding'}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

