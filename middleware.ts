import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/shop(.*)',
  '/product(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/users/sync',
  '/api/languages(.*)',
  '/api/currencies(.*)',
  '/api/products(.*)',
  '/api/categories(.*)',
  '/api/coupons(.*)',
  '/api/stores(.*)',
]);

// Define onboarding routes (require auth but special handling)
const isOnboardingApiRoute = createRouteMatcher(['/api/onboarding(.*)']);

// Define onboarding route
const isOnboardingRoute = createRouteMatcher(['/onboarding(.*)']);

// Check if URL contains Clerk redirect parameters (indicates we're in a Clerk auth flow)
function hasClerkRedirectParams(url: string): boolean {
  const urlObj = new URL(url);
  return urlObj.searchParams.has('__clerk_db_jwt') || 
         urlObj.searchParams.has('__clerk_redirect_url') ||
         urlObj.searchParams.has('__clerk_synced');
}

// Clean up Clerk redirect parameters from URL
function cleanClerkParams(url: string): string {
  const urlObj = new URL(url);
  urlObj.searchParams.delete('__clerk_db_jwt');
  urlObj.searchParams.delete('__clerk_redirect_url');
  urlObj.searchParams.delete('__clerk_synced');
  return urlObj.toString();
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { isAuthenticated, sessionClaims, redirectToSignIn } = await auth();
  const url = req.url;

  // Check if we're in a Clerk redirect flow (after authentication)
  // When Clerk redirects back with JWT params, we should allow the request through
  // even if isAuthenticated is false initially, as Clerk needs to process the JWT first
  const isClerkRedirect = hasClerkRedirectParams(url);

  // For onboarding routes with Clerk redirect params, always allow access
  // This prevents redirect loops when Clerk redirects back after authentication
  // The JWT will be processed by Clerk, and the user will be authenticated on the next request
  if (isOnboardingRoute(req) && isClerkRedirect) {
    return NextResponse.next();
  }

  // For users visiting /onboarding page, allow access if authenticated
  // Don't check onboarding status here - let the layout handle it
  if (isAuthenticated && isOnboardingRoute(req)) {
    return NextResponse.next();
  }

  // If user is not authenticated and trying to access onboarding, redirect to sign-in
  // But only if we're not in a Clerk redirect flow (to prevent loops)
  if (!isAuthenticated && isOnboardingRoute(req) && !isClerkRedirect) {
    // Use the pathname only (without query params) to avoid including Clerk params in redirect
    const returnUrl = new URL(req.url);
    returnUrl.search = ''; // Remove all query params
    return redirectToSignIn({ returnBackUrl: returnUrl.toString() });
  }

  // For onboarding API routes, require authentication but allow access
  if (isOnboardingApiRoute(req)) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // If the user isn't signed in and the route is private, redirect to sign-in
  // But skip if we're in a Clerk redirect flow
  if (!isAuthenticated && !isPublicRoute(req) && !isClerkRedirect) {
    const returnUrl = new URL(req.url);
    returnUrl.search = ''; // Remove all query params
    return redirectToSignIn({ returnBackUrl: returnUrl.toString() });
  }

  // Note: We don't force onboarding completion for all routes
  // Only vendors who want to create a store need to complete onboarding
  // This allows regular users to use the app without vendor onboarding

  // If the user is logged in and the route is protected, let them view
  if (isAuthenticated && !isPublicRoute(req)) {
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

