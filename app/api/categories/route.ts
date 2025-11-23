import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/middleware';

// Helper function to build nested category tree
function buildCategoryTree(categories: any[], parentId: string | null = null): any[] {
  return categories
    .filter(cat => cat.parentId === parentId)
    .map(cat => ({
      ...cat,
      children: buildCategoryTree(categories, cat.id)
    }));
}

// GET /api/categories - Get all categories (nested tree structure)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const flat = searchParams.get('flat') === 'true'; // Option to get flat list instead of tree

    const categories = await prisma.category.findMany({
      where: {
        isActive: true // Only return active categories for public API
      },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }
      ],
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            children: true
          }
        }
      }
    });

    if (flat) {
      return NextResponse.json({
        success: true,
        data: categories,
      });
    }

    // Build nested tree structure
    const tree = buildCategoryTree(categories);

    return NextResponse.json({
      success: true,
      data: tree,
      flat: categories, // Also include flat list for reference
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    // Check admin permission
    const permissionError = await requirePermission(userId, 'categories', 'create');
    if (permissionError) {
      return permissionError;
    }

    const body = await request.json();
    const { name, description, parentId, image, thumbnail, isActive, displayOrder } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug already exists
    const existingCategory = await prisma.category.findUnique({
      where: { slug }
    });

    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'A category with this name already exists' },
        { status: 400 }
      );
    }

    // Validate parent if provided
    if (parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: parentId }
      });

      if (!parent) {
        return NextResponse.json(
          { success: false, error: 'Parent category not found' },
          { status: 400 }
        );
      }
    }

    const category = await prisma.category.create({
      data: {
        name,
        description: description || null,
        slug,
        parentId: parentId || null,
        image: image || null,
        thumbnail: thumbnail || null,
        isActive: isActive !== undefined ? isActive : true,
        displayOrder: displayOrder || 0,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create category' },
      { status: 500 }
    );
  }
}

