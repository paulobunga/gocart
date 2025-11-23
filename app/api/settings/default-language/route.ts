import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/middleware';
import { getUserIdFromRequest } from '@/lib/middleware';

// GET default language
export async function GET(request: NextRequest) {
  try {
    const defaultLanguageSetting = await prisma.setting.findUnique({
      where: { key: 'default_language' },
    });

    if (!defaultLanguageSetting) {
      return NextResponse.json({
        success: false,
        error: 'Default language not set',
      });
    }

    const language = await prisma.language.findUnique({
      where: { id: defaultLanguageSetting.value },
    });

    if (!language) {
      return NextResponse.json({
        success: false,
        error: 'Default language not found',
      });
    }

    return NextResponse.json({
      success: true,
      data: language,
    });
  } catch (error) {
    console.error('Error fetching default language:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch default language' },
      { status: 500 }
    );
  }
}

// PUT update default language (admin only)
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const roleCheck = await requireRole(userId, 'admin');
    
    if (roleCheck) {
      return roleCheck;
    }

    const body = await request.json();
    const { languageId } = body;

    if (!languageId) {
      return NextResponse.json(
        { success: false, error: 'Language ID is required' },
        { status: 400 }
      );
    }

    // Verify language exists and is active
    const language = await prisma.language.findUnique({
      where: { id: languageId },
    });

    if (!language || !language.isActive) {
      return NextResponse.json(
        { success: false, error: 'Invalid or inactive language' },
        { status: 400 }
      );
    }

    // Update or create setting
    const setting = await prisma.setting.upsert({
      where: { key: 'default_language' },
      update: { value: languageId },
      create: {
        key: 'default_language',
        value: languageId,
      },
    });

    return NextResponse.json({
      success: true,
      data: language,
      message: 'Default language updated successfully',
    });
  } catch (error) {
    console.error('Error updating default language:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update default language' },
      { status: 500 }
    );
  }
}

