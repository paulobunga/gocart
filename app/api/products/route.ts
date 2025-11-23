import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/products - Get all products
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const storeId = searchParams.get('storeId');
    const category = searchParams.get('category');
    const limit = searchParams.get('limit');

    let where: any = {};

    if (storeId) {
      where.storeId = storeId;
    }

    if (category) {
      where.category = category;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        store: {
          include: {
            user: true,
          },
        },
        rating: {
          include: {
            user: true,
          },
        },
      },
      take: limit ? parseInt(limit) : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to match the expected format
    const transformedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      mrp: product.mrp,
      price: product.price,
      images: product.images,
      category: product.category,
      storeId: product.storeId,
      inStock: product.inStock,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      store: {
        id: product.store.id,
        userId: product.store.userId,
        name: product.store.name,
        description: product.store.description,
        username: product.store.username,
        address: product.store.address,
        status: product.store.status,
        isActive: product.store.isActive,
        logo: product.store.logo,
        email: product.store.email,
        contact: product.store.contact,
        createdAt: product.store.createdAt,
        updatedAt: product.store.updatedAt,
        user: {
          id: product.store.user.id,
          name: product.store.user.name,
          email: product.store.user.email,
          image: product.store.user.image,
        },
      },
      rating: product.rating.map((r) => ({
        id: r.id,
        rating: r.rating,
        review: r.review,
        userId: r.userId,
        productId: r.productId,
        orderId: r.orderId,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        user: {
          id: r.user.id,
          name: r.user.name,
          email: r.user.email,
          image: r.user.image,
        },
        product: {
          id: product.id,
          name: product.name,
          category: product.category,
        },
      })),
    }));

    return NextResponse.json({
      success: true,
      data: transformedProducts,
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

