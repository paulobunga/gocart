'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { sendOnboardingConfirmationEmail } from '@/lib/email/onboarding'

export async function completeVendorOnboarding(formData: {
  // Personal Info
  firstName: string
  lastName: string
  phone: string
  
  // Business Info
  storeName: string
  storeUsername: string
  businessEmail: string
  businessPhone: string
  businessAddress: string
  description: string
  logo: string
  
  // Plan Selection
  plan: string
  billing: string
  
  // Payment
  paymentProvider: string
  paymentTransactionId: string
}) {
  const { isAuthenticated, userId } = await auth()

  if (!isAuthenticated || !userId) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    // Check if user already has a store
    const existingStore = await prisma.store.findUnique({
      where: { userId }
    })

    if (existingStore) {
      return { success: false, error: 'You already have a store' }
    }

    // Check if store username is taken
    const usernameTaken = await prisma.store.findUnique({
      where: { username: formData.storeUsername }
    })

    if (usernameTaken) {
      return { success: false, error: 'Store username is already taken' }
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Get plan details from database
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { type: formData.plan as any }
    })

    if (!plan) {
      return { success: false, error: 'Invalid subscription plan' }
    }

    const limits = {
      maxProducts: plan.maxProducts,
      maxImagesPerProduct: plan.maxImagesPerProduct
    }

    // Calculate subscription end date
    const startDate = new Date()
    const endDate = new Date()
    if (formData.billing === 'MONTHLY') {
      endDate.setMonth(endDate.getMonth() + 1)
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1)
    }

    // Determine if subscription should be active
    // Free plans are active immediately
    // Paid plans are inactive until payment is confirmed
    const isFreePlan = formData.plan === 'FREE' || formData.plan?.toUpperCase() === 'FREE'
    const subscriptionActive = isFreePlan || !!formData.paymentTransactionId

    // Create store and subscription
    const store = await prisma.store.create({
      data: {
        userId,
        name: formData.storeName,
        username: formData.storeUsername,
        email: formData.businessEmail,
        contact: formData.businessPhone,
        address: formData.businessAddress,
        description: formData.description,
        logo: formData.logo || user.image,
        status: 'pending',
        isActive: false,
        subscription: {
          create: {
            planType: formData.plan as any,
            planId: plan.id,
            billing: formData.billing as any,
            maxProducts: limits.maxProducts,
            maxImagesPerProduct: limits.maxImagesPerProduct,
            isActive: subscriptionActive,
            startDate,
            endDate,
            paymentProvider: formData.paymentProvider ? (formData.paymentProvider as any) : null,
            paymentTransactionId: formData.paymentTransactionId || null
          }
        }
      },
      include: {
        subscription: true
      }
    })

    // Update Clerk user metadata
    const client = await clerkClient()
    await client.users.updateUser(userId, {
      publicMetadata: {
        vendorOnboardingComplete: true,
        storeId: store.id,
        subscriptionPlan: formData.plan
      }
    })

    // Send confirmation email
    const storeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/shop/${store.username}`
    await sendOnboardingConfirmationEmail({
      to: user.email,
      storeName: store.name,
      vendorName: `${formData.firstName} ${formData.lastName}`,
      plan: formData.plan,
      billing: formData.billing,
      storeUrl
    })

    revalidatePath('/onboarding')
    revalidatePath('/store')

    return { 
      success: true, 
      storeId: store.id,
      message: 'Vendor onboarding completed successfully' 
    }
  } catch (error: any) {
    console.error('Error completing vendor onboarding:', error)
    return { 
      success: false, 
      error: error.message || 'Failed to complete onboarding' 
    }
  }
}

