import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// GET /api/products/[id]/variants - Get all variants for a product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const variants = await prisma.productVariant.findMany({
      where: {
        productId: params.id,
      },
      include: {
        attributes: {
          include: {
            value: {
              include: {
                attribute: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: variants,
    });
  } catch (error: any) {
    console.error('Error fetching variants:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch variants' },
      { status: 500 }
    );
  }
}

// POST /api/products/[id]/variants - Create a new variant
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
    const { sku, mrp, price, stock, inStock, images, attributeValues } = body;

    // Verify product exists and belongs to user's store
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        store: true,
        attributes: {
          include: {
            attribute: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    if (product.store.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (product.productType !== 'COMPLEX') {
      return NextResponse.json(
        { success: false, error: 'Variants can only be added to complex products' },
        { status: 400 }
      );
    }

    // Validate attribute values
    if (!Array.isArray(attributeValues) || attributeValues.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one attribute value is required' },
        { status: 400 }
      );
    }

    // Check if variant with same attribute combination already exists
    const existingVariants = await prisma.productVariant.findMany({
      where: {
        productId: params.id,
      },
      include: {
        attributes: true,
      },
    });

    // Check for duplicate attribute combinations
    for (const existing of existingVariants) {
      const existingValueIds = existing.attributes.map((a) => a.valueId).sort();
      const newValueIds = attributeValues.sort();
      if (JSON.stringify(existingValueIds) === JSON.stringify(newValueIds)) {
        return NextResponse.json(
          { success: false, error: 'Variant with this attribute combination already exists' },
          { status: 400 }
        );
      }
    }

    // Create variant
    const variant = await prisma.productVariant.create({
      data: {
        productId: params.id,
        sku: sku || null,
        mrp: mrp ? parseFloat(mrp) : product.mrp,
        price: price ? parseFloat(price) : product.price,
        stock: stock !== undefined ? parseInt(stock) : 0,
        inStock: inStock !== undefined ? inStock : true,
        images: images || [],
        attributes: {
          create: attributeValues.map((valueId: string) => ({
            valueId,
          })),
        },
      },
      include: {
        attributes: {
          include: {
            value: {
              include: {
                attribute: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: variant,
    });
  } catch (error: any) {
    console.error('Error creating variant:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create variant' },
      { status: 500 }
    );
  }
}

