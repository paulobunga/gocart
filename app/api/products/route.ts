import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { canAddProduct, canAddImages } from '@/lib/subscription-limits';

// GET /api/products - Get all products
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const storeId = searchParams.get('storeId');
    const category = searchParams.get('category');
    const limit = searchParams.get('limit');

    let where: any = {};

    if (storeId) {
      where.storeId = storeId;
    }

    if (category) {
      where.category = category;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        store: {
          include: {
            user: true,
          },
        },
        currency: true, // Include currency information
        rating: {
          include: {
            user: true,
          },
        },
        variants: {
          include: {
            attributes: {
              include: {
                value: {
                  include: {
                    attribute: true,
                  },
                },
              },
            },
          },
        },
        attributes: {
          include: {
            attribute: {
              include: {
                values: {
                  where: {
                    isActive: true,
                  },
                },
              },
            },
          },
        },
      },
      take: limit ? parseInt(limit) : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to match the expected format
    const transformedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      mrp: product.mrp,
      price: product.price,
      currency: product.currency ? {
        id: product.currency.id,
        code: product.currency.code,
        name: product.currency.name,
        symbol: product.currency.symbol,
        exchangeRate: product.currency.exchangeRate,
      } : null,
      images: product.images,
      category: product.category,
      storeId: product.storeId,
      inStock: product.inStock,
      productType: product.productType,
      variants: product.variants?.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        mrp: variant.mrp,
        price: variant.price,
        stock: variant.stock,
        inStock: variant.inStock,
        images: variant.images,
        attributes: variant.attributes?.map((va) => ({
          id: va.id,
          value: {
            id: va.value.id,
            value: va.value.value,
            displayValue: va.value.displayValue,
            attribute: {
              id: va.value.attribute.id,
              name: va.value.attribute.name,
              displayName: va.value.attribute.displayName,
            },
          },
        })),
      })) || [],
      attributes: product.attributes?.map((mapping) => ({
        id: mapping.id,
        attribute: {
          id: mapping.attribute.id,
          name: mapping.attribute.name,
          displayName: mapping.attribute.displayName,
          values: mapping.attribute.values?.map((v) => ({
            id: v.id,
            value: v.value,
            displayValue: v.displayValue,
          })) || [],
        },
      })) || [],
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      store: {
        id: product.store.id,
        userId: product.store.userId,
        name: product.store.name,
        description: product.store.description,
        username: product.store.username,
        address: product.store.address,
        status: product.store.status,
        isActive: product.store.isActive,
        logo: product.store.logo,
        email: product.store.email,
        contact: product.store.contact,
        createdAt: product.store.createdAt,
        updatedAt: product.store.updatedAt,
        user: {
          id: product.store.user.id,
          name: product.store.user.name,
          email: product.store.user.email,
          image: product.store.user.image,
        },
      },
      rating: product.rating.map((r) => ({
        id: r.id,
        rating: r.rating,
        review: r.review,
        userId: r.userId,
        productId: r.productId,
        orderId: r.orderId,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        user: {
          id: r.user.id,
          name: r.user.name,
          email: r.user.email,
          image: r.user.image,
        },
        product: {
          id: product.id,
          name: product.name,
          category: product.category,
        },
      })),
    }));

    return NextResponse.json({
      success: true,
      data: transformedProducts,
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      mrp, 
      price, 
      images, 
      category, 
      storeId, 
      inStock,
      productType = 'SIMPLE',
      attributes = [], // Array of attribute IDs for complex products
      variants = [] // Array of variant objects for complex products
    } = body;

    // Validate required fields
    if (!name || !description || !mrp || !price || !category || !storeId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate complex product requirements
    if (productType === 'COMPLEX') {
      if (!Array.isArray(attributes) || attributes.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Complex products require at least one attribute' },
          { status: 400 }
        );
      }

      if (!Array.isArray(variants) || variants.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Complex products require at least one variant' },
          { status: 400 }
        );
      }
    }

    // Verify store belongs to user
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: { subscription: true }
    });

    if (!store) {
      return NextResponse.json(
        { success: false, error: 'Store not found' },
        { status: 404 }
      );
    }

    if (store.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Store does not belong to user' },
        { status: 403 }
      );
    }

    // Check subscription limits for products
    const productLimitCheck = await canAddProduct(storeId);
    if (!productLimitCheck.allowed) {
      return NextResponse.json(
        { success: false, error: productLimitCheck.reason },
        { status: 403 }
      );
    }

    // Check subscription limits for images
    const imageArray = Array.isArray(images) ? images : [];
    if (imageArray.length > 0) {
      // For new products, we check if the number of images exceeds the limit
      const limits = await prisma.vendorSubscription.findUnique({
        where: { storeId },
        select: { maxImagesPerProduct: true }
      });

      if (limits && imageArray.length > limits.maxImagesPerProduct) {
        return NextResponse.json(
          { 
            success: false, 
            error: `You can only have ${limits.maxImagesPerProduct} images per product on your current plan.` 
          },
          { status: 403 }
        );
      }
    }

    // Get default currency for pricing
    const defaultCurrencySetting = await prisma.setting.findUnique({
      where: { key: 'default_currency' }
    });

    let defaultCurrency;
    if (defaultCurrencySetting) {
      defaultCurrency = await prisma.currency.findUnique({
        where: { id: defaultCurrencySetting.value }
      });
    }

    // If no default currency, get first active currency
    if (!defaultCurrency) {
      defaultCurrency = await prisma.currency.findFirst({
        where: { isActive: true },
        orderBy: { code: 'asc' }
      });
    }

    if (!defaultCurrency) {
      return NextResponse.json(
        { success: false, error: 'No currency configured. Please set up currencies first.' },
        { status: 500 }
      );
    }

    // Create product with variants if complex
    const product = await prisma.product.create({
      data: {
        name,
        description,
        mrp: parseFloat(mrp),
        price: parseFloat(price),
        currencyId: defaultCurrency.id,
        images: imageArray,
        category,
        storeId,
        inStock: inStock !== undefined ? inStock : true,
        productType: productType === 'COMPLEX' ? 'COMPLEX' : 'SIMPLE',
        // Create attribute mappings for complex products
        ...(productType === 'COMPLEX' && {
          attributes: {
            create: attributes.map((attributeId: string) => ({
              attributeId,
            })),
          },
        }),
        // Create variants for complex products
        ...(productType === 'COMPLEX' && {
          variants: {
            create: variants.map((variant: any) => ({
              sku: variant.sku || null,
              mrp: variant.mrp ? parseFloat(variant.mrp) : parseFloat(mrp),
              price: variant.price ? parseFloat(variant.price) : parseFloat(price),
              stock: variant.stock !== undefined ? parseInt(variant.stock) : 0,
              inStock: variant.inStock !== undefined ? variant.inStock : true,
              images: variant.images || [],
              attributes: {
                create: variant.attributeValues.map((valueId: string) => ({
                  valueId,
                })),
              },
            })),
          },
        }),
      },
      include: {
        store: true,
        currency: true,
        variants: {
          include: {
            attributes: {
              include: {
                value: {
                  include: {
                    attribute: true,
                  },
                },
              },
            },
          },
        },
        attributes: {
          include: {
            attribute: {
              include: {
                values: {
                  where: {
                    isActive: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}

