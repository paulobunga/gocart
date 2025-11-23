import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import sharp from 'sharp';
import { requirePermission } from '@/lib/middleware';

// POST /api/categories/upload - Upload category image and generate thumbnail
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    // Check admin permission
    const permissionError = await requirePermission(userId, 'categories', 'create');
    if (permissionError) {
      return permissionError;
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'categories');
    const thumbnailsDir = join(process.cwd(), 'public', 'uploads', 'categories', 'thumbnails');
    
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    if (!existsSync(thumbnailsDir)) {
      await mkdir(thumbnailsDir, { recursive: true });
    }

    // Generate unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `category-${timestamp}.${extension}`;
    const thumbnailFilename = `category-${timestamp}-thumb.jpg`; // Thumbnails are always JPEG
    
    const filepath = join(uploadsDir, filename);
    const thumbnailPath = join(thumbnailsDir, thumbnailFilename);

    // Save original image
    await writeFile(filepath, buffer);

    // Generate thumbnail (300x300, maintaining aspect ratio)
    // Convert to JPEG for better compression
    await sharp(buffer)
      .resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 })
      .toFile(thumbnailPath);

    // Return public URLs
    const imageUrl = `/uploads/categories/${filename}`;
    const thumbnailUrl = `/uploads/categories/thumbnails/${thumbnailFilename}`;

    return NextResponse.json({
      success: true,
      image: imageUrl,
      thumbnail: thumbnailUrl,
    });
  } catch (error: any) {
    console.error('Error uploading category image:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}

