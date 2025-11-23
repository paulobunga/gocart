import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/coupons - Get all coupons
export async function GET(request: NextRequest) {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: coupons,
    });
  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}

