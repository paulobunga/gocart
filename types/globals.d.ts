export {}

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      vendorOnboardingComplete?: boolean
      storeId?: string
      subscriptionPlan?: string
    }
  }
}

