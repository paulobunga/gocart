import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// GET /api/attributes/[id]/values - Get all values for an attribute
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const values = await prisma.productAttributeValue.findMany({
      where: {
        attributeId: params.id,
        isActive: true,
      },
      orderBy: {
        value: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: values,
    });
  } catch (error: any) {
    console.error('Error fetching attribute values:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch attribute values' },
      { status: 500 }
    );
  }
}

// POST /api/attributes/[id]/values - Create a new attribute value
export async function POST(
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
    const { value, displayValue } = body;

    if (!value) {
      return NextResponse.json(
        { success: false, error: 'Value is required' },
        { status: 400 }
      );
    }

    // Check if attribute exists
    const attribute = await prisma.productAttribute.findUnique({
      where: { id: params.id },
    });

    if (!attribute) {
      return NextResponse.json(
        { success: false, error: 'Attribute not found' },
        { status: 404 }
      );
    }

    // Check if value already exists for this attribute
    const existing = await prisma.productAttributeValue.findUnique({
      where: {
        attributeId_value: {
          attributeId: params.id,
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

    const attributeValue = await prisma.productAttributeValue.create({
      data: {
        attributeId: params.id,
        value,
        displayValue: displayValue || value,
      },
    });

    return NextResponse.json({
      success: true,
      data: attributeValue,
    });
  } catch (error: any) {
    console.error('Error creating attribute value:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create attribute value' },
      { status: 500 }
    );
  }
}

