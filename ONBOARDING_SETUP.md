# Vendor Onboarding Setup Guide

This guide explains how to set up the vendor onboarding flow using Clerk's session tokens and metadata.

## Prerequisites

- Clerk account with an application set up
- Database with Prisma schema migrated
- Environment variables configured

## Step 1: Configure Clerk Session Token

To track vendor onboarding status, you need to add custom claims to your Clerk session token.

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Navigate to **Sessions** page
3. Under **Customize session token**, in the **Claims** editor, add:

```json
{
  "metadata": "{{user.public_metadata}}"
}
```

4. Click **Save**

This allows you to access the user's `publicMetadata` in your middleware and server components.

## Step 2: Environment Variables

Make sure you have the following environment variables in your `.env.local`:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk Webhook
WEBHOOK_SECRET=whsec_...

# Clerk Redirect URLs
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/onboarding
```

## Step 3: Database Migration

Run the Prisma migration to add the subscription models:

```bash
npx prisma migrate dev --name add_vendor_subscriptions
npx prisma generate
```

## Step 4: How It Works

### Onboarding Flow

1. User clicks "Become A Vendor" link in navbar
2. User is redirected to `/onboarding` (must be authenticated)
3. User completes multi-step form:
   - **Step 1**: Personal Information
   - **Step 2**: Business Information (with store name availability check)
   - **Step 3**: Select Subscription Plan (Free, Premium, Business)
   - **Step 4**: Payment (PayPal, Iotec MTN, Iotec Airtel)
   - **Step 5**: Review and Submit
4. On completion:
   - Store is created in database
   - Subscription is created with limits
   - User's Clerk `publicMetadata` is updated with `vendorOnboardingComplete: true`
   - User is redirected to confirmation page
   - Confirmation email is sent (if email service is configured)

### Subscription Plans

- **Free**: 10 products max, 3 images per product
- **Premium**: 100 products max, 10 images per product
- **Business**: Unlimited products, 20 images per product

### Subscription Limits Enforcement

The system automatically enforces subscription limits:

- When adding products: Checks if store has reached max products
- When adding images: Checks if product has reached max images per product

Use the utility functions in `lib/subscription-limits.ts`:

```typescript
import { canAddProduct, canAddImages } from '@/lib/subscription-limits'

// Check if store can add a product
const { allowed, reason } = await canAddProduct(storeId)
if (!allowed) {
  // Show error message
}

// Check if product can have more images
const { allowed, reason } = await canAddImages(storeId, productId, newImageCount)
```

## Step 5: Payment Integration

Currently, payment processing is simulated. To integrate real payment providers:

### PayPal Integration

1. Install PayPal SDK: `npm install @paypal/checkout-server-sdk`
2. Update `app/api/onboarding/process-payment/route.ts` with PayPal SDK
3. Add PayPal credentials to environment variables

### Iotec Integration

1. Get Iotec API credentials
2. Update `app/api/onboarding/process-payment/route.ts` with Iotec SDK
3. Add Iotec credentials to environment variables

## Step 6: Email Configuration

To send confirmation emails, configure an email service (e.g., Resend, SendGrid):

1. Install email service SDK
2. Update `app/(public)/onboarding/_actions.ts` to send emails
3. Add email service credentials to environment variables

## Testing

1. Sign up or sign in to your application
2. Click "Become A Vendor" in the navbar
3. Complete the onboarding form
4. Verify that:
   - Store is created in database
   - Subscription is created with correct limits
   - User metadata is updated in Clerk
   - Confirmation page is displayed
   - User can access store dashboard

## Troubleshooting

### User can't access onboarding page

- Check if user is authenticated
- Verify middleware configuration
- Check Clerk session token claims configuration

### Store creation fails

- Verify database connection
- Check Prisma schema is migrated
- Ensure user doesn't already have a store

### Payment processing fails

- Check payment provider credentials
- Verify payment API endpoints
- Check network connectivity

### Subscription limits not enforced

- Verify subscription is created correctly
- Check `lib/subscription-limits.ts` functions
- Ensure product/image creation uses limit checks

## Files Structure

```
app/
  (public)/
    onboarding/
      page.jsx              # Main onboarding form wizard
      layout.tsx            # Layout that redirects if already onboarded
      _actions.ts           # Server actions for completing onboarding
      confirmation/
        page.jsx            # Confirmation page after onboarding
  api/
    onboarding/
      check-name/           # Check store name availability
      upload-logo/          # Upload store logo
      process-payment/      # Process subscription payment
      complete/             # Complete onboarding
lib/
  subscription-limits.ts    # Utility functions for enforcing limits
middleware.ts               # Middleware for route protection
types/
  globals.d.ts              # TypeScript types for session claims
```

## References

- [Clerk Onboarding Guide](https://clerk.com/docs/guides/development/add-onboarding-flow)
- [Clerk Session Tokens](https://clerk.com/docs/guides/sessions/session-tokens)
- [Clerk Metadata](https://clerk.com/docs/guides/users/extending#public-metadata)


