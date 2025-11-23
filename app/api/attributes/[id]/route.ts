import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// GET /api/attributes/[id] - Get a specific attribute
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attribute = await prisma.productAttribute.findUnique({
      where: { id: params.id },
      include: {
        values: {
          where: {
            isActive: true,
          },
          orderBy: {
            value: 'asc',
          },
        },
      },
    });

    if (!attribute) {
      return NextResponse.json(
        { success: false, error: 'Attribute not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: attribute,
    });
  } catch (error: any) {
    console.error('Error fetching attribute:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch attribute' },
      { status: 500 }
    );
  }
}

// PUT /api/attributes/[id] - Update an attribute
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, displayName, description, isActive } = body;

    const attribute = await prisma.productAttribute.findUnique({
      where: { id: params.id },
    });

    if (!attribute) {
      return NextResponse.json(
        { success: false, error: 'Attribute not found' },
        { status: 404 }
      );
    }

    // Check if name is being changed and if new name already exists
    if (name && name !== attribute.name) {
      const existing = await prisma.productAttribute.findUnique({
        where: { name },
      });

      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Attribute with this name already exists' },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.productAttribute.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(displayName !== undefined && { displayName }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        values: {
          where: {
            isActive: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating attribute:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update attribute' },
      { status: 500 }
    );
  }
}

// DELETE /api/attributes/[id] - Delete an attribute (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const attribute = await prisma.productAttribute.findUnique({
      where: { id: params.id },
    });

    if (!attribute) {
      return NextResponse.json(
        { success: false, error: 'Attribute not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.productAttribute.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Attribute deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting attribute:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete attribute' },
      { status: 500 }
    );
  }
}

