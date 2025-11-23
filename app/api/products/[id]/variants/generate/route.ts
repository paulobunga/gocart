import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// Helper function to generate all combinations of attribute values
function generateCombinations(attributeValues: string[][]): string[][] {
  if (attributeValues.length === 0) return [];
  if (attributeValues.length === 1) return attributeValues[0].map((v) => [v]);

  const [first, ...rest] = attributeValues;
  const restCombinations = generateCombinations(rest);

  const combinations: string[][] = [];
  for (const value of first) {
    for (const combination of restCombinations) {
      combinations.push([value, ...combination]);
    }
  }

  return combinations;
}

// POST /api/products/[id]/variants/generate - Generate all possible variant combinations
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify product exists and belongs to user's store
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        store: true,
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

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    if (product.store.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (product.productType !== 'COMPLEX') {
      return NextResponse.json(
        { success: false, error: 'Variants can only be generated for complex products' },
        { status: 400 }
      );
    }

    // Get all attribute values for each attribute
    const attributeValueArrays: string[][] = [];
    for (const mapping of product.attributes) {
      const values = mapping.attribute.values.map((v) => v.id);
      if (values.length === 0) {
        return NextResponse.json(
          { success: false, error: `Attribute ${mapping.attribute.name} has no values` },
          { status: 400 }
        );
      }
      attributeValueArrays.push(values);
    }

    // Generate all combinations
    const combinations = generateCombinations(attributeValueArrays);

    // Format response with attribute details
    const formattedCombinations = await Promise.all(
      combinations.map(async (combination) => {
        const variantAttributes = await Promise.all(
          combination.map(async (valueId) => {
            const value = await prisma.productAttributeValue.findUnique({
              where: { id: valueId },
              include: {
                attribute: true,
              },
            });
            return value;
          })
        );

        return {
          attributeValues: combination,
          displayName: variantAttributes
            .map((v) => `${v?.attribute.displayName || v?.attribute.name}: ${v?.displayValue || v?.value}`)
            .join(', '),
          attributes: variantAttributes.map((v) => ({
            attributeId: v?.attributeId,
            attributeName: v?.attribute.name,
            valueId: v?.id,
            value: v?.value,
            displayValue: v?.displayValue,
          })),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        combinations: formattedCombinations,
        total: formattedCombinations.length,
      },
    });
  } catch (error: any) {
    console.error('Error generating variants:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate variants' },
      { status: 500 }
    );
  }
}

