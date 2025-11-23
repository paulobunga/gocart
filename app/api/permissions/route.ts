import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/permissions - Get all permissions
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const resource = searchParams.get('resource');
    const roleId = searchParams.get('roleId');

    let where: any = {};

    if (resource) {
      where.resource = resource;
    }

    const permissions = await prisma.permission.findMany({
      where,
      include: {
        _count: {
          select: {
            rolePermissions: true,
          },
        },
      },
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' },
      ],
    });

    // If roleId is provided, include whether each permission is assigned to the role
    let data;
    if (roleId) {
      const rolePermissions = await prisma.rolePermission.findMany({
        where: { roleId },
        select: { permissionId: true },
      });

      const assignedPermissionIds = new Set(
        rolePermissions.map((rp) => rp.permissionId)
      );

      data = permissions.map((permission) => ({
        id: permission.id,
        name: permission.name,
        resource: permission.resource,
        action: permission.action,
        description: permission.description,
        roleCount: permission._count.rolePermissions,
        isAssigned: assignedPermissionIds.has(permission.id),
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt,
      }));
    } else {
      data = permissions.map((permission) => ({
        id: permission.id,
        name: permission.name,
        resource: permission.resource,
        action: permission.action,
        description: permission.description,
        roleCount: permission._count.rolePermissions,
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt,
      }));
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

// POST /api/permissions - Create a new permission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, resource, action, description } = body;

    if (!name || !resource || !action) {
      return NextResponse.json(
        { success: false, error: 'Name, resource, and action are required' },
        { status: 400 }
      );
    }

    // Check if permission already exists
    const existingPermission = await prisma.permission.findUnique({
      where: { name },
    });

    if (existingPermission) {
      return NextResponse.json(
        { success: false, error: 'Permission with this name already exists' },
        { status: 400 }
      );
    }

    const permission = await prisma.permission.create({
      data: {
        name,
        resource,
        action,
        description,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: permission.id,
        name: permission.name,
        resource: permission.resource,
        action: permission.action,
        description: permission.description,
      },
    });
  } catch (error: any) {
    console.error('Error creating permission:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create permission' },
      { status: 500 }
    );
  }
}

// PUT /api/permissions - Update a permission
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, resource, action, description } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Permission ID is required' },
        { status: 400 }
      );
    }

    // Check if permission exists
    const existingPermission = await prisma.permission.findUnique({
      where: { id },
    });

    if (!existingPermission) {
      return NextResponse.json(
        { success: false, error: 'Permission not found' },
        { status: 404 }
      );
    }

    // If name is being changed, check for conflicts
    if (name && name !== existingPermission.name) {
      const nameConflict = await prisma.permission.findUnique({
        where: { name },
      });

      if (nameConflict) {
        return NextResponse.json(
          { success: false, error: 'Permission with this name already exists' },
          { status: 400 }
        );
      }
    }

    const permission = await prisma.permission.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(resource !== undefined && { resource }),
        ...(action !== undefined && { action }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: permission.id,
        name: permission.name,
        resource: permission.resource,
        action: permission.action,
        description: permission.description,
      },
    });
  } catch (error: any) {
    console.error('Error updating permission:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update permission' },
      { status: 500 }
    );
  }
}

// DELETE /api/permissions - Delete a permission
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Permission ID is required' },
        { status: 400 }
      );
    }

    // Check if permission exists
    const permission = await prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      return NextResponse.json(
        { success: false, error: 'Permission not found' },
        { status: 404 }
      );
    }

    // Delete permission (cascade will handle related records)
    await prisma.permission.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Permission deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting permission:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete permission' },
      { status: 500 }
    );
  }
}

