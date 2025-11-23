import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// GET current currency (from cookie or default)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const currencyId = cookieStore.get('currency_id')?.value;

    let currency;

    if (currencyId) {
      currency = await prisma.currency.findUnique({
        where: { id: currencyId },
      });
    }

    // If no currency in cookie or currency not found, get default
    if (!currency) {
      const defaultCurrencySetting = await prisma.setting.findUnique({
        where: { key: 'default_currency' },
      });

      if (defaultCurrencySetting) {
        currency = await prisma.currency.findUnique({
          where: { id: defaultCurrencySetting.value },
        });
      }

      // If still no currency, get first active currency
      if (!currency) {
        currency = await prisma.currency.findFirst({
          where: { isActive: true },
          orderBy: { code: 'asc' },
        });
      }
    }

    if (!currency) {
      return NextResponse.json(
        { success: false, error: 'No currency found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: currency,
    });
  } catch (error) {
    console.error('Error fetching current currency:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch current currency' },
      { status: 500 }
    );
  }
}

// POST set current currency (save to cookie)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currencyId } = body;

    if (!currencyId) {
      return NextResponse.json(
        { success: false, error: 'Currency ID is required' },
        { status: 400 }
      );
    }

    // Verify currency exists
    const currency = await prisma.currency.findUnique({
      where: { id: currencyId },
    });

    if (!currency || !currency.isActive) {
      return NextResponse.json(
        { success: false, error: 'Invalid or inactive currency' },
        { status: 400 }
      );
    }

    // Set cookie (expires in 1 year)
    const cookieStore = await cookies();
    cookieStore.set('currency_id', currencyId, {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    });

    return NextResponse.json({
      success: true,
      data: currency,
      message: 'Currency updated successfully',
    });
  } catch (error) {
    console.error('Error setting current currency:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set current currency' },
      { status: 500 }
    );
  }
}

