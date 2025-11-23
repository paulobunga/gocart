import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/dashboard - Get admin dashboard data
export async function GET(request: NextRequest) {
  try {
    // Get counts
    const [ordersCount, storesCount, productsCount] = await Promise.all([
      prisma.order.count(),
      prisma.store.count(),
      prisma.product.count(),
    ]);

    // Get total revenue
    const revenueResult = await prisma.order.aggregate({
      _sum: {
        total: true,
      },
    });
    const revenue = revenueResult._sum.total || 0;

    // Get all orders for chart
    const allOrders = await prisma.order.findMany({
      select: {
        createdAt: true,
        total: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        orders: ordersCount,
        stores: storesCount,
        products: productsCount,
        revenue: revenue.toFixed(2),
        allOrders: allOrders.map((order) => ({
          createdAt: order.createdAt,
          total: order.total,
        })),
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin dashboard data:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

