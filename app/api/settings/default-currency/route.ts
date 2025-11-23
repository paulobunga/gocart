import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET default currency
export async function GET(request: NextRequest) {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'default_currency' },
    });

    if (!setting) {
      return NextResponse.json(
        { success: false, error: 'Default currency not set' },
        { status: 404 }
      );
    }

    const currency = await prisma.currency.findUnique({
      where: { id: setting.value },
    });

    if (!currency) {
      return NextResponse.json(
        { success: false, error: 'Default currency not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: currency,
    });
  } catch (error) {
    console.error('Error fetching default currency:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch default currency' },
      { status: 500 }
    );
  }
}

// PUT update default currency (admin only)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { currencyId } = body;

    if (!currencyId) {
      return NextResponse.json(
        { success: false, error: 'Currency ID is required' },
        { status: 400 }
      );
    }

    // Verify currency exists and is active
    const currency = await prisma.currency.findUnique({
      where: { id: currencyId },
    });

    if (!currency || !currency.isActive) {
      return NextResponse.json(
        { success: false, error: 'Invalid or inactive currency' },
        { status: 400 }
      );
    }

    // Update or create setting
    const setting = await prisma.setting.upsert({
      where: { key: 'default_currency' },
      update: { value: currencyId },
      create: {
        key: 'default_currency',
        value: currencyId,
      },
    });

    return NextResponse.json({
      success: true,
      data: currency,
      message: 'Default currency updated successfully',
    });
  } catch (error) {
    console.error('Error updating default currency:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update default currency' },
      { status: 500 }
    );
  }
}

