import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// PUT /api/attributes/values/[id] - Update an attribute value
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
    const { value, displayValue, isActive } = body;

    const attributeValue = await prisma.productAttributeValue.findUnique({
      where: { id: params.id },
    });

    if (!attributeValue) {
      return NextResponse.json(
        { success: false, error: 'Attribute value not found' },
        { status: 404 }
      );
    }

    // Check if value is being changed and if new value already exists
    if (value && value !== attributeValue.value) {
      const existing = await prisma.productAttributeValue.findUnique({
        where: {
          attributeId_value: {
            attributeId: attributeValue.attributeId,
            value,
          },
        },
      });

      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Value already exists for this attribute' },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.productAttributeValue.update({
      where: { id: params.id },
      data: {
        ...(value && { value }),
        ...(displayValue !== undefined && { displayValue }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating attribute value:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update attribute value' },
      { status: 500 }
    );
  }
}

// DELETE /api/attributes/values/[id] - Delete an attribute value (soft delete)
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

    const attributeValue = await prisma.productAttributeValue.findUnique({
      where: { id: params.id },
    });

    if (!attributeValue) {
      return NextResponse.json(
        { success: false, error: 'Attribute value not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.productAttributeValue.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Attribute value deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting attribute value:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete attribute value' },
      { status: 500 }
    );
  }
}

