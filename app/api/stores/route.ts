import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/stores - Get all stores
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const username = searchParams.get('username');

    let where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (username) {
      where.username = username;
    }

    const stores = await prisma.store.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to match the expected format
    const transformedStores = stores.map((store) => ({
      id: store.id,
      userId: store.userId,
      name: store.name,
      description: store.description,
      username: store.username,
      address: store.address,
      status: store.status,
      isActive: store.isActive,
      logo: store.logo,
      email: store.email,
      contact: store.contact,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt,
      user: {
        id: store.user.id,
        name: store.user.name,
        email: store.user.email,
        image: store.user.image,
      },
    }));

    return NextResponse.json({
      success: true,
      data: transformedStores,
    });
  } catch (error: any) {
    console.error('Error fetching stores:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch stores' },
      { status: 500 }
    );
  }
}

