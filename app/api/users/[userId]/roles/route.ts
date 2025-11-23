import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assignRoleToUser, removeRoleFromUser, getUserRoles } from '@/lib/permissions';

// GET /api/users/[userId]/roles - Get roles for a user
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    const roles = await getUserRoles(userId);

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

    return NextResponse.json({
      success: true,
      data: {
        roles: roles,
        roleDetails: userRoles.map((ur) => ({
          id: ur.role.id,
          name: ur.role.name,
          description: ur.role.description,
          permissions: ur.role.rolePermissions.map((rp) => ({
            id: rp.permission.id,
            name: rp.permission.name,
            resource: rp.permission.resource,
            action: rp.permission.action,
          })),
          assignedAt: ur.createdAt,
        })),
      },
    });
  } catch (error: any) {
    console.error('Error fetching user roles:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch user roles' },
      { status: 500 }
    );
  }
}

// POST /api/users/[userId]/roles - Assign a role to a user
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const body = await request.json();
    const { roleName } = body;

    if (!roleName) {
      return NextResponse.json(
        { success: false, error: 'Role name is required' },
        { status: 400 }
      );
    }

    const success = await assignRoleToUser(userId, roleName);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to assign role. Role may not exist.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Role assigned successfully',
    });
  } catch (error: any) {
    console.error('Error assigning role:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to assign role' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[userId]/roles - Remove a role from a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const searchParams = request.nextUrl.searchParams;
    const roleName = searchParams.get('roleName');

    if (!roleName) {
      return NextResponse.json(
        { success: false, error: 'Role name is required' },
        { status: 400 }
      );
    }

    const success = await removeRoleFromUser(userId, roleName);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to remove role. Role may not exist.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Role removed successfully',
    });
  } catch (error: any) {
    console.error('Error removing role:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to remove role' },
      { status: 500 }
    );
  }
}

