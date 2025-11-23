# Clerk Authentication Setup Guide

This project uses Clerk for authentication with email and Google OAuth support.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk Webhook (for syncing users with database)
WEBHOOK_SECRET=whsec_...

# Clerk Custom Auth Pages (Optional but recommended)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

## Getting Your Clerk Keys

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application or select an existing one
3. Navigate to **API Keys** to get:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

## Setting Up Google OAuth

1. In Clerk Dashboard, go to **User & Authentication** > **Social Connections**
2. Click **Add connection** and select **Google**
3. For development, Clerk provides preconfigured credentials
4. For production, you'll need to:
   - Create a project in [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add the credentials to Clerk

## Setting Up Webhooks

1. In Clerk Dashboard, go to **Webhooks**
2. Click **Add Endpoint**
3. Set the endpoint URL to: `https://yourdomain.com/api/webhooks/clerk`
4. Select the following events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Copy the **Signing Secret** and add it to your `.env.local` as `WEBHOOK_SECRET`

## Features Implemented

- ✅ Email-based authentication
- ✅ Google OAuth authentication
- ✅ Custom sign-in and sign-up pages
- ✅ User profile management with profile picture upload
- ✅ Automatic Customer role assignment for new users
- ✅ Order tracking for authenticated customers
- ✅ Protected routes with middleware
- ✅ Integration with existing roles and permissions system

## User Roles

New users are automatically assigned the **Customer** role when they sign up. This role includes permissions for:
- Viewing products
- Creating orders
- Viewing own orders
- Managing cart
- Managing addresses
- Creating ratings

## Routes

- `/sign-in` - Custom styled sign in page (matches website aesthetic)
- `/sign-up` - Custom styled sign up page (matches website aesthetic)
- `/profile` - User profile page (requires authentication)
- `/orders` - User orders page (requires authentication)

## Custom Auth Pages

The authentication pages have been customized to match your website's design aesthetic:
- **Brand colors**: Green accents (`green-600`) and indigo buttons (`indigo-500`)
- **Rounded-full inputs**: Matching your site's input style
- **Logo integration**: GoCart logo displayed at the top
- **Consistent typography**: Using your site's font and text colors
- **Smooth transitions**: Hover effects and scale animations matching your buttons

The pages use Clerk's `appearance` prop to extensively customize the components while maintaining all functionality.

## API Routes

- `/api/webhooks/clerk` - Webhook endpoint for syncing Clerk users with database
- `/api/orders` - Get orders (automatically filters by authenticated user for customers)

