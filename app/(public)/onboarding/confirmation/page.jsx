'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, Store, ArrowRight, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function OnboardingConfirmationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const storeId = searchParams.get('storeId')
  const paymentStatus = searchParams.get('payment')
  const [countdown, setCountdown] = useState(15)

  useEffect(() => {
    if (paymentStatus === 'success') {
      toast.success('Payment completed successfully!')
    } else if (paymentStatus === 'failed') {
      toast.error('Payment verification failed. Please contact support.')
    } else if (paymentStatus === 'cancelled') {
      toast.error('Payment was cancelled. You can complete payment later.')
    } else if (paymentStatus === 'error') {
      toast.error('An error occurred during payment processing.')
    }
  }, [paymentStatus])

  useEffect(() => {
    if (countdown > 0 && !paymentStatus) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && !paymentStatus) {
      router.push('/store')
    }
  }, [countdown, router, paymentStatus])

  const getStatusConfig = () => {
    switch (paymentStatus) {
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-500',
          bgColor: 'bg-green-100',
          title: 'Payment Successful!',
          message: 'Your payment has been processed successfully and your subscription is now active. Your vendor onboarding is complete!'
        }
      case 'failed':
        return {
          icon: XCircle,
          iconColor: 'text-red-500',
          bgColor: 'bg-red-100',
          title: 'Payment Verification Failed',
          message: 'We were unable to verify your payment. Please contact our support team with your order details to resolve this issue. Your account has not been charged.'
        }
      case 'cancelled':
        return {
          icon: AlertCircle,
          iconColor: 'text-yellow-500',
          bgColor: 'bg-yellow-100',
          title: 'Payment Cancelled',
          message: 'The payment process was cancelled. No charges were made. Please complete the payment from your store dashboard to activate your subscription.'
        }
      case 'error':
        return {
          icon: XCircle,
          iconColor: 'text-red-500',
          bgColor: 'bg-red-100',
          title: 'Payment Processing Error',
          message: 'An unexpected error occurred during payment processing. Please try again or contact our support team for assistance. Your account has not been charged.'
        }
      default:
        return {
          icon: CheckCircle,
          iconColor: 'text-green-500',
          bgColor: 'bg-green-100',
          title: 'Welcome to GoCart Vendor!',
          message: 'Your vendor onboarding has been completed successfully. We\'ve sent a confirmation email to your registered email address.'
        }
    }
  }

  const statusConfig = getStatusConfig()
  const StatusIcon = statusConfig.icon

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className={`w-20 h-20 ${statusConfig.bgColor} rounded-full flex items-center justify-center`}>
            <StatusIcon className={statusConfig.iconColor} size={48} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-slate-800 mb-4">
          {statusConfig.title}
        </h1>

        <p className="text-lg text-slate-600 mb-8">
          {statusConfig.message}
        </p>

        <div className="bg-slate-50 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Store className="text-indigo-500" size={24} />
            <h2 className="text-xl font-semibold text-slate-800">What's Next?</h2>
          </div>
          <ul className="text-left space-y-3 text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={20} />
              <span>Your store is pending admin approval</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={20} />
              <span>You'll receive an email once your store is approved</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={20} />
              <span>Start adding products to your store</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={20} />
              <span>Manage your store settings and preferences</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/store"
            className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition flex items-center justify-center gap-2"
          >
            Go to Store Dashboard
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/"
            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
          >
            Back to Home
          </Link>
        </div>

        {!paymentStatus && (
          <p className="text-sm text-slate-500 mt-6">
            Redirecting to store dashboard in {countdown} seconds...
          </p>
        )}
      </div>
    </div>
  )
}


