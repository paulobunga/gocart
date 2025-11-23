import { prisma } from './prisma';

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  try {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    for (const userRole of userRoles) {
      for (const rolePermission of userRole.role.rolePermissions) {
        const permission = rolePermission.permission;
        if (
          permission.resource === resource &&
          permission.action === action
        ) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Check if a user has any of the specified permissions
 */
export async function hasAnyPermission(
  userId: string,
  permissions: Array<{ resource: string; action: string }>
): Promise<boolean> {
  for (const perm of permissions) {
    if (await hasPermission(userId, perm.resource, perm.action)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a user has all of the specified permissions
 */
export async function hasAllPermissions(
  userId: string,
  permissions: Array<{ resource: string; action: string }>
): Promise<boolean> {
  for (const perm of permissions) {
    if (!(await hasPermission(userId, perm.resource, perm.action))) {
      return false;
    }
  }
  return true;
}

/**
 * Check if a user has a specific role
 */
export async function hasRole(userId: string, roleName: string): Promise<boolean> {
  try {
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId,
        role: {
          name: roleName,
        },
      },
    });

    return !!userRole;
  } catch (error) {
    console.error('Error checking role:', error);
    return false;
  }
}

/**
 * Get all roles for a user
 */
export async function getUserRoles(userId: string): Promise<string[]> {
  try {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: true,
      },
    });

    return userRoles.map((ur) => ur.role.name);
  } catch (error) {
    console.error('Error getting user roles:', error);
    return [];
  }
}

/**
 * Get all permissions for a user (from all their roles)
 */
export async function getUserPermissions(
  userId: string
): Promise<Array<{ resource: string; action: string; name: string }>> {
  try {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const permissionsMap = new Map<string, { resource: string; action: string; name: string }>();

    for (const userRole of userRoles) {
      for (const rolePermission of userRole.role.rolePermissions) {
        const permission = rolePermission.permission;
        const key = `${permission.resource}:${permission.action}`;
        if (!permissionsMap.has(key)) {
          permissionsMap.set(key, {
            resource: permission.resource,
            action: permission.action,
            name: permission.name,
          });
        }
      }
    }

    return Array.from(permissionsMap.values());
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
}

/**
 * Assign a role to a user
 */
export async function assignRoleToUser(
  userId: string,
  roleName: string
): Promise<boolean> {
  try {
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      return false;
    }

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id,
        },
      },
      create: {
        userId,
        roleId: role.id,
      },
      update: {},
    });

    return true;
  } catch (error) {
    console.error('Error assigning role:', error);
    return false;
  }
}

/**
 * Remove a role from a user
 */
export async function removeRoleFromUser(
  userId: string,
  roleName: string
): Promise<boolean> {
  try {
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      return false;
    }

    await prisma.userRole.deleteMany({
      where: {
        userId,
        roleId: role.id,
      },
    });

    return true;
  } catch (error) {
    console.error('Error removing role:', error);
    return false;
  }
}

