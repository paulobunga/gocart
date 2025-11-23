import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/middleware';

// GET /api/categories/[id] - Get a single category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            thumbnail: true
          }
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error: any) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

// PUT /api/categories/[id] - Update a category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    // Check admin permission
    const permissionError = await requirePermission(userId, 'categories', 'update');
    if (permissionError) {
      return permissionError;
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, parentId, image, thumbnail, isActive, displayOrder } = body;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Prevent setting parent to itself or creating circular references
    if (parentId === id) {
      return NextResponse.json(
        { success: false, error: 'Category cannot be its own parent' },
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

      // Check for circular reference: ensure parent is not a descendant
      const checkCircular = async (categoryId: string, targetId: string): Promise<boolean> => {
        const category = await prisma.category.findUnique({
          where: { id: categoryId },
          include: { children: true }
        });
        
        if (!category) return false;
        if (category.id === targetId) return true;
        
        for (const child of category.children) {
          if (await checkCircular(child.id, targetId)) {
            return true;
          }
        }
        return false;
      };

      if (await checkCircular(parentId, id)) {
        return NextResponse.json(
          { success: false, error: 'Cannot create circular reference in category hierarchy' },
          { status: 400 }
        );
      }
    }

    // Generate slug if name changed
    let slug = existingCategory.slug;
    if (name && name !== existingCategory.name) {
      slug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Check if new slug already exists (excluding current category)
      const slugExists = await prisma.category.findFirst({
        where: {
          slug,
          id: { not: id }
        }
      });

      if (slugExists) {
        return NextResponse.json(
          { success: false, error: 'A category with this name already exists' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (slug !== existingCategory.slug) updateData.slug = slug;
    if (parentId !== undefined) updateData.parentId = parentId || null;
    if (image !== undefined) updateData.image = image;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        children: {
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
    console.error('Error updating category:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - Delete a category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    // Check admin permission
    const permissionError = await requirePermission(userId, 'categories', 'delete');
    if (permissionError) {
      return permissionError;
    }

    const { id } = await params;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: true
      }
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category has children
    if (category.children.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete category with subcategories. Please delete or move subcategories first.' },
        { status: 400 }
      );
    }

    // Check if category is used by any products
    const productsCount = await prisma.product.count({
      where: {
        category: category.name
      }
    });

    if (productsCount > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete category. It is used by ${productsCount} product(s).` },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete category' },
      { status: 500 }
    );
  }
}

