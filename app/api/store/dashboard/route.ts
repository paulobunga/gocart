import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/store/dashboard - Get store dashboard data
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json(
        { success: false, error: 'storeId is required' },
        { status: 400 }
      );
    }

    // Get store orders
    const orders = await prisma.order.findMany({
      where: { storeId },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    // Calculate totals
    const totalOrders = orders.length;
    const totalEarnings = orders.reduce((sum, order) => sum + order.total, 0);
    const totalProducts = await prisma.product.count({
      where: { storeId },
    });

    // Get ratings for store products
    const products = await prisma.product.findMany({
      where: { storeId },
      include: {
        rating: {
          include: {
            user: true,
            product: true,
          },
        },
      },
    });

    const ratings = products.flatMap((product) =>
      product.rating.map((r) => ({
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
          id: r.product.id,
          name: r.product.name,
          category: r.product.category,
        },
      }))
    );

    return NextResponse.json({
      success: true,
      data: {
        ratings,
        totalOrders,
        totalEarnings,
        totalProducts,
      },
    });
  } catch (error: any) {
    console.error('Error fetching store dashboard data:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

