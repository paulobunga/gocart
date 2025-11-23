import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// GET /api/attributes - Get all attributes
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeValues = searchParams.get('includeValues') === 'true';

    const attributes = await prisma.productAttribute.findMany({
      where: {
        isActive: true,
      },
      include: includeValues
        ? {
            values: {
              where: {
                isActive: true,
              },
              orderBy: {
                value: 'asc',
              },
            },
          }
        : undefined,
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: attributes,
    });
  } catch (error: any) {
    console.error('Error fetching attributes:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch attributes' },
      { status: 500 }
    );
  }
}

// POST /api/attributes - Create a new attribute
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin permissions
    // You can add role-based access control here if needed

    const body = await request.json();
    const { name, displayName, description } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Attribute name is required' },
        { status: 400 }
      );
    }

    // Check if attribute with same name already exists
    const existing = await prisma.productAttribute.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Attribute with this name already exists' },
        { status: 400 }
      );
    }

    const attribute = await prisma.productAttribute.create({
      data: {
        name,
        displayName: displayName || name,
        description: description || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: attribute,
    });
  } catch (error: any) {
    console.error('Error creating attribute:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create attribute' },
      { status: 500 }
    );
  }
}

