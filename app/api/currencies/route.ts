import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const currencies = await prisma.currency.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: currencies,
    });
  } catch (error) {
    console.error('Error fetching currencies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch currencies' },
      { status: 500 }
    );
  }
}

