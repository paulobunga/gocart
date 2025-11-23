import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// GET current language (from cookie or default)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const languageId = cookieStore.get('language_id')?.value;

    let language;

    if (languageId) {
      language = await prisma.language.findUnique({
        where: { id: languageId },
      });
    }

    // If no language in cookie or language not found, get default
    if (!language) {
      const defaultLanguageSetting = await prisma.setting.findUnique({
        where: { key: 'default_language' },
      });

      if (defaultLanguageSetting) {
        language = await prisma.language.findUnique({
          where: { id: defaultLanguageSetting.value },
        });
      }

      // If still no language, get first active language
      if (!language) {
        language = await prisma.language.findFirst({
          where: { isActive: true },
          orderBy: { name: 'asc' },
        });
      }
    }

    if (!language) {
      return NextResponse.json(
        { success: false, error: 'No language found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: language,
    });
  } catch (error) {
    console.error('Error fetching current language:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch current language' },
      { status: 500 }
    );
  }
}

// POST set current language (save to cookie)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { languageId } = body;

    if (!languageId) {
      return NextResponse.json(
        { success: false, error: 'Language ID is required' },
        { status: 400 }
      );
    }

    // Verify language exists
    const language = await prisma.language.findUnique({
      where: { id: languageId },
    });

    if (!language || !language.isActive) {
      return NextResponse.json(
        { success: false, error: 'Invalid or inactive language' },
        { status: 400 }
      );
    }

    // Set cookie (expires in 1 year)
    const cookieStore = await cookies();
    cookieStore.set('language_id', languageId, {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    });

    return NextResponse.json({
      success: true,
      data: language,
      message: 'Language updated successfully',
    });
  } catch (error) {
    console.error('Error setting current language:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set current language' },
      { status: 500 }
    );
  }
}

