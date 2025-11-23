# Vendor Onboarding Setup Guide

Complete guide to set up the vendor onboarding system with payment and email integrations.

## Quick Start

1. **Run Database Migration**
   ```bash
   npx prisma migrate dev --name add_vendor_subscriptions
   npx prisma generate
   ```

2. **Run Setup Check**
   ```bash
   npm run db:setup-check
   # or
   tsx scripts/setup-onboarding.ts
   ```

3. **Configure Clerk Session Token** (Manual step - see below)

4. **Install Payment/Email SDKs** (Optional - for production)

## Step-by-Step Setup

### 1. Database Migration

The schema has been updated with subscription models. Run the migration:

```bash
npx prisma migrate dev --name add_vendor_subscriptions
npx prisma generate
```

This creates:
- `VendorSubscription` model
- `SubscriptionPlan` enum (FREE, PREMIUM, BUSINESS)
- `SubscriptionBilling` enum (MONTHLY, ANNUAL)
- `PaymentProvider` enum (PAYPAL, IOTEC_MTN, IOTEC_AIRTEL)

### 2. Configure Clerk Session Token

**This is a critical step that must be done manually:**

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Navigate to **Sessions** page
3. Under **Customize session token**, in the **Claims** editor, add:

```json
{
  "metadata": "{{user.public_metadata}}"
}
```

4. Click **Save**

This allows the middleware and server components to access user metadata to check onboarding status.

### 3. Environment Variables

Add these to your `.env.local`:

```env
# Required
DATABASE_URL=your_database_url
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
WEBHOOK_SECRET=whsec_...

# Optional - Payment Providers
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox  # or 'live' for production

# Iotec Payment Gateway (OAuth 2.0)
IOTEC_CLIENT_ID=your_iotec_client_id
IOTEC_CLIENT_SECRET=your_iotec_client_secret
IOTEC_WALLET_ID=your_wallet_id  # UUID format
IOTEC_BASE_URL=https://pay.iotec.io  # Optional, defaults to this
IOTEC_AUTH_URL=https://id.iotec.io  # Optional, defaults to this

# Optional - Email Provider
EMAIL_PROVIDER=resend  # or 'sendgrid' or 'nodemailer'
RESEND_API_KEY=your_resend_api_key  # if using Resend
SENDGRID_API_KEY=your_sendgrid_api_key  # if using SendGrid
SMTP_HOST=your_smtp_host  # if using Nodemailer
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
EMAIL_FROM=GoCart <onboarding@gocart.com>

# App URL (for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

### 4. Install Payment Provider SDKs (Optional)

For production, install the payment provider SDKs:

**PayPal:**
```bash
npm install @paypal/checkout-server-sdk
```

**Iotec:**
Check [Iotec documentation](https://iotec.io/docs) for their SDK installation.

### 5. Install Email Provider SDK (Optional)

Choose one email provider:

**Resend (Recommended):**
```bash
npm install resend
```

**SendGrid:**
```bash
npm install @sendgrid/mail
```

**Nodemailer (SMTP):**
```bash
npm install nodemailer
```

### 6. Enable Payment/Email Integrations

The payment and email integrations are set up with mock/development mode by default. To enable real integrations:

1. **PayPal Integration:**
   - Uncomment the PayPal SDK code in `lib/payments/paypal.ts`
   - Add your PayPal credentials to `.env.local`
   - Test in sandbox mode first

2. **Iotec Integration:**
   - Uncomment the Iotec API code in `lib/payments/iotec.ts`
   - Add your Iotec credentials to `.env.local`
   - Update the API endpoint if needed

3. **Email Integration:**
   - Uncomment the email provider code in `lib/email/onboarding.ts`
   - Add your email provider credentials to `.env.local`
   - Test email sending

## Testing

1. **Test Database Setup:**
   ```bash
   npm run db:test
   ```

2. **Test Onboarding Flow:**
   - Sign in to your application
   - Click "Become A Vendor" in navbar
   - Complete the onboarding form
   - Verify store is created in database
   - Check Clerk metadata is updated

3. **Test Subscription Limits:**
   - Try adding products beyond your plan limit
   - Verify error messages appear
   - Try adding images beyond limit per product

## File Structure

```
lib/
  payments/
    paypal.ts          # PayPal payment integration
    iotec.ts           # Iotec mobile money integration
  email/
    onboarding.ts      # Email service for onboarding
  subscription-limits.ts  # Utility for enforcing limits

app/
  (public)/
    onboarding/
      page.jsx         # Main onboarding form
      layout.tsx       # Layout with redirect logic
      _actions.ts      # Server actions
      confirmation/
        page.jsx       # Success page

app/api/
  onboarding/
    check-name/        # Store name availability
    upload-logo/       # Logo upload
    process-payment/   # Payment processing
    complete/          # Complete onboarding

scripts/
  setup-onboarding.ts  # Setup verification script
```

## Troubleshooting

### "VendorSubscription model not found"
- Run: `npx prisma migrate dev --name add_vendor_subscriptions`
- Then: `npx prisma generate`

### "Unauthorized" errors
- Check Clerk session token is configured correctly
- Verify `CLERK_SECRET_KEY` is set in `.env.local`

### Payment processing fails
- Check payment provider credentials
- Verify API keys are correct
- Check network connectivity
- For development, mock payments are used automatically

### Email not sending
- Check email provider credentials
- Verify `EMAIL_PROVIDER` is set correctly
- Check email provider API limits
- Emails won't fail onboarding (graceful degradation)

### Subscription limits not enforced
- Verify subscription is created correctly
- Check `lib/subscription-limits.ts` functions
- Ensure product creation uses limit checks

## Production Checklist

Before going to production:

- [ ] Run database migrations
- [ ] Configure Clerk session token
- [ ] Set up payment provider accounts (PayPal/Iotec)
- [ ] Configure email service
- [ ] Update environment variables for production
- [ ] Test complete onboarding flow
- [ ] Test payment processing (use sandbox/test mode first)
- [ ] Test email delivery
- [ ] Verify subscription limits enforcement
- [ ] Set up monitoring for payment/email failures
- [ ] Configure error logging

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the code comments in integration files
3. Check provider documentation (PayPal, Iotec, email providers)

