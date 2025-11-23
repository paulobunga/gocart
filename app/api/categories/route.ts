import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/categories - Get all unique categories from products
export async function GET(request: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      select: {
        category: true,
      },
      distinct: ['category'],
    });

    const categories = products.map((p) => p.category).filter(Boolean);

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

