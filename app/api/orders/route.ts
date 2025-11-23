import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET /api/orders - Get all orders
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const storeId = searchParams.get('storeId');

    let where: any = {};

    // If no userId is provided in query params, use the authenticated user's ID
    // This ensures customers only see their own orders
    if (userId) {
      where.userId = userId;
    } else if (clerkUserId) {
      // For authenticated users without userId param, use their Clerk ID
      where.userId = clerkUserId;
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
            variant: {
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
        variantId: item.variantId,
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
        variant: item.variant ? {
          id: item.variant.id,
          sku: item.variant.sku,
          mrp: item.variant.mrp,
          price: item.variant.price,
          stock: item.variant.stock,
          inStock: item.variant.inStock,
          images: item.variant.images,
          attributes: item.variant.attributes?.map((va) => ({
            id: va.id,
            value: {
              id: va.value.id,
              value: va.value.value,
              displayValue: va.value.displayValue,
              attribute: {
                id: va.value.attribute.id,
                name: va.value.attribute.name,
                displayName: va.value.attribute.displayName,
              },
            },
          })) || [],
        } : null,
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

