import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// GET /api/products/[id]/variants/[variantId] - Get a specific variant
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; variantId: string } }
) {
  try {
    const variant = await prisma.productVariant.findUnique({
      where: { id: params.variantId },
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
        product: {
          include: {
            store: true,
          },
        },
      },
    });

    if (!variant) {
      return NextResponse.json(
        { success: false, error: 'Variant not found' },
        { status: 404 }
      );
    }

    if (variant.productId !== params.id) {
      return NextResponse.json(
        { success: false, error: 'Variant does not belong to this product' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: variant,
    });
  } catch (error: any) {
    console.error('Error fetching variant:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch variant' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id]/variants/[variantId] - Update a variant
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; variantId: string } }
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
    const { sku, mrp, price, stock, inStock, images } = body;

    // Verify variant exists and belongs to user's store
    const variant = await prisma.productVariant.findUnique({
      where: { id: params.variantId },
      include: {
        product: {
          include: {
            store: true,
          },
        },
      },
    });

    if (!variant) {
      return NextResponse.json(
        { success: false, error: 'Variant not found' },
        { status: 404 }
      );
    }

    if (variant.productId !== params.id) {
      return NextResponse.json(
        { success: false, error: 'Variant does not belong to this product' },
        { status: 400 }
      );
    }

    if (variant.product.store.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const updated = await prisma.productVariant.update({
      where: { id: params.variantId },
      data: {
        ...(sku !== undefined && { sku }),
        ...(mrp !== undefined && { mrp: parseFloat(mrp) }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(inStock !== undefined && { inStock }),
        ...(images !== undefined && { images }),
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
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating variant:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update variant' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id]/variants/[variantId] - Delete a variant
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; variantId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify variant exists and belongs to user's store
    const variant = await prisma.productVariant.findUnique({
      where: { id: params.variantId },
      include: {
        product: {
          include: {
            store: true,
          },
        },
      },
    });

    if (!variant) {
      return NextResponse.json(
        { success: false, error: 'Variant not found' },
        { status: 404 }
      );
    }

    if (variant.productId !== params.id) {
      return NextResponse.json(
        { success: false, error: 'Variant does not belong to this product' },
        { status: 400 }
      );
    }

    if (variant.product.store.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await prisma.productVariant.delete({
      where: { id: params.variantId },
    });

    return NextResponse.json({
      success: true,
      message: 'Variant deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting variant:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete variant' },
      { status: 500 }
    );
  }
}

