import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/orders - Get all orders
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const storeId = searchParams.get('storeId');

    let where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (storeId) {
      where.storeId = storeId;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: true,
        store: {
          include: {
            user: true,
          },
        },
        address: true,
        orderItems: {
          include: {
            product: {
              include: {
                store: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to match the expected format
    const transformedOrders = orders.map((order) => ({
      id: order.id,
      total: order.total,
      status: order.status,
      userId: order.userId,
      storeId: order.storeId,
      addressId: order.addressId,
      isPaid: order.isPaid,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      isCouponUsed: order.isCouponUsed,
      coupon: order.coupon,
      orderItems: order.orderItems.map((item) => ({
        orderId: item.orderId,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        product: {
          id: item.product.id,
          name: item.product.name,
          description: item.product.description,
          mrp: item.product.mrp,
          price: item.product.price,
          images: item.product.images,
          category: item.product.category,
          storeId: item.product.storeId,
          inStock: item.product.inStock,
          store: {
            id: item.product.store.id,
            name: item.product.store.name,
            username: item.product.store.username,
            logo: item.product.store.logo,
          },
        },
      })),
      address: order.address,
      user: {
        id: order.user.id,
        name: order.user.name,
        email: order.user.email,
        image: order.user.image,
      },
    }));

    return NextResponse.json({
      success: true,
      data: transformedOrders,
    });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

