/**
 * Example usage of the roles and permissions system
 * 
 * This file demonstrates how to use the permission checking functions
 * in your API routes and components.
 */

import { hasPermission, hasRole, assignRoleToUser, getUserPermissions } from './permissions';

// Example 1: Check if a user has a specific permission in an API route
export async function exampleCheckPermission(userId: string) {
  // Check if user can manage products
  const canManageProducts = await hasPermission(userId, 'products', 'manage');
  
  if (!canManageProducts) {
    return { error: 'Insufficient permissions' };
  }
  
  // User can manage products, proceed with the operation
  return { success: true };
}

// Example 2: Check if a user has a specific role
export async function exampleCheckRole(userId: string) {
  const isAdmin = await hasRole(userId, 'Admin');
  
  if (!isAdmin) {
    return { error: 'Admin access required' };
  }
  
  return { success: true };
}

// Example 3: Assign a role to a user
export async function exampleAssignRole(userId: string) {
  const success = await assignRoleToUser(userId, 'Vendor');
  
  if (success) {
    console.log('Role assigned successfully');
  } else {
    console.log('Failed to assign role');
  }
}

// Example 4: Get all permissions for a user
export async function exampleGetUserPermissions(userId: string) {
  const permissions = await getUserPermissions(userId);
  
  console.log('User permissions:', permissions);
  // Output: [
  //   { resource: 'products', action: 'create', name: 'products.create' },
  //   { resource: 'products', action: 'read', name: 'products.read' },
  //   ...
  // ]
}

// Example 5: Using in an API route with middleware
/*
import { requirePermission, getUserIdFromRequest } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  
  // Check permission
  const authError = await requirePermission(userId, 'products', 'create');
  if (authError) {
    return authError; // Returns 401 or 403 response
  }
  
  // User is authorized, proceed with creating product
  // ... your logic here
}
*/

// Example 6: Check multiple permissions
/*
import { hasAllPermissions, hasAnyPermission } from '@/lib/permissions';

// Check if user has ALL permissions
const canFullyManage = await hasAllPermissions(userId, [
  { resource: 'products', action: 'create' },
  { resource: 'products', action: 'update' },
  { resource: 'products', action: 'delete' },
]);

// Check if user has ANY permission
const canViewOrManage = await hasAnyPermission(userId, [
  { resource: 'products', action: 'read' },
  { resource: 'products', action: 'manage' },
]);
*/

