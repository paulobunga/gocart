import { NextRequest, NextResponse } from 'next/server';
import { hasPermission, hasRole } from './permissions';

/**
 * Middleware helper to check if a user has a specific permission
 * Returns null if authorized, or a NextResponse with error if not
 */
export async function requirePermission(
  userId: string | null,
  resource: string,
  action: string
): Promise<NextResponse | null> {
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const hasAccess = await hasPermission(userId, resource, action);
  
  if (!hasAccess) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Insufficient permissions' },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Middleware helper to check if a user has a specific role
 * Returns null if authorized, or a NextResponse with error if not
 */
export async function requireRole(
  userId: string | null,
  roleName: string
): Promise<NextResponse | null> {
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const hasAccess = await hasRole(userId, roleName);
  
  if (!hasAccess) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Insufficient role' },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Middleware helper to check if a user has any of the specified roles
 */
export async function requireAnyRole(
  userId: string | null,
  roleNames: string[]
): Promise<NextResponse | null> {
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  for (const roleName of roleNames) {
    if (await hasRole(userId, roleName)) {
      return null;
    }
  }

  return NextResponse.json(
    { success: false, error: 'Forbidden: Insufficient role' },
    { status: 403 }
  );
}

/**
 * Extract user ID from request
 * This is a placeholder - you should implement your actual auth logic here
 * For example, if using NextAuth, you'd get the session here
 */
export function getUserIdFromRequest(request: NextRequest): string | null {
  // TODO: Implement your actual authentication logic
  // Example with NextAuth:
  // const session = await getServerSession(request);
  // return session?.user?.id || null;
  
  // For now, you can get it from headers or query params
  // This is just a placeholder
  const userId = request.headers.get('x-user-id') || 
                 request.nextUrl.searchParams.get('userId');
  
  return userId;
}

