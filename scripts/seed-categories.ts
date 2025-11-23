import "dotenv/config";
import { prisma } from '../lib/prisma';

async function _seedCategories() {
  try {
    console.log('🌱 Seeding categories...');

    // Define categories with nested structure
    const categoriesData = [
      {
        name: 'Electronics',
        description: 'Electronic devices and gadgets',
        displayOrder: 1,
        children: [
          { name: 'Smartphones', description: 'Mobile phones and smartphones', displayOrder: 1 },
          { name: 'Laptops', description: 'Laptop computers and notebooks', displayOrder: 2 },
          { name: 'Tablets', description: 'Tablet devices', displayOrder: 3 },
          { name: 'Accessories', description: 'Electronic accessories', displayOrder: 4 },
        ]
      },
      {
        name: 'Clothing',
        description: 'Apparel and fashion items',
        displayOrder: 2,
        children: [
          { name: 'Men\'s Clothing', description: 'Clothing for men', displayOrder: 1 },
          { name: 'Women\'s Clothing', description: 'Clothing for women', displayOrder: 2 },
          { name: 'Kids\' Clothing', description: 'Clothing for children', displayOrder: 3 },
          { name: 'Shoes', description: 'Footwear', displayOrder: 4 },
        ]
      },
      {
        name: 'Home & Kitchen',
        description: 'Home and kitchen essentials',
        displayOrder: 3,
        children: [
          { name: 'Furniture', description: 'Home furniture', displayOrder: 1 },
          { name: 'Kitchen Appliances', description: 'Kitchen and cooking appliances', displayOrder: 2 },
          { name: 'Home Decor', description: 'Home decoration items', displayOrder: 3 },
          { name: 'Bedding', description: 'Bedding and linens', displayOrder: 4 },
        ]
      },
      {
        name: 'Beauty & Health',
        description: 'Beauty and health products',
        displayOrder: 4,
        children: [
          { name: 'Skincare', description: 'Skincare products', displayOrder: 1 },
          { name: 'Makeup', description: 'Cosmetics and makeup', displayOrder: 2 },
          { name: 'Hair Care', description: 'Hair care products', displayOrder: 3 },
          { name: 'Health & Wellness', description: 'Health and wellness products', displayOrder: 4 },
        ]
      },
      {
        name: 'Sports & Outdoors',
        description: 'Sports and outdoor equipment',
        displayOrder: 5,
        children: [
          { name: 'Fitness Equipment', description: 'Exercise and fitness equipment', displayOrder: 1 },
          { name: 'Outdoor Gear', description: 'Camping and outdoor gear', displayOrder: 2 },
          { name: 'Sports Apparel', description: 'Sports clothing and gear', displayOrder: 3 },
        ]
      },
      {
        name: 'Books & Media',
        description: 'Books, movies, and media',
        displayOrder: 6,
        children: [
          { name: 'Books', description: 'Physical and digital books', displayOrder: 1 },
          { name: 'Movies & TV', description: 'Movies and TV shows', displayOrder: 2 },
          { name: 'Music', description: 'Music albums and tracks', displayOrder: 3 },
        ]
      },
      {
        name: 'Toys & Games',
        description: 'Toys and games for all ages',
        displayOrder: 7,
        children: [
          { name: 'Action Figures', description: 'Action figures and collectibles', displayOrder: 1 },
          { name: 'Board Games', description: 'Board games and puzzles', displayOrder: 2 },
          { name: 'Video Games', description: 'Video games and consoles', displayOrder: 3 },
        ]
      },
      {
        name: 'Food & Drink',
        description: 'Food and beverage products',
        displayOrder: 8,
        children: [
          { name: 'Snacks', description: 'Snacks and treats', displayOrder: 1 },
          { name: 'Beverages', description: 'Drinks and beverages', displayOrder: 2 },
          { name: 'Gourmet', description: 'Gourmet food items', displayOrder: 3 },
        ]
      },
    ];

    // Helper function to generate slug from name
    const generateSlug = (name: string): string => {
      return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    };

    // Create parent categories first
    console.log('📝 Creating parent categories...');
    const createdParents = new Map<string, any>();

    for (const categoryData of categoriesData) {
      const slug = generateSlug(categoryData.name);
      
      const existing = await prisma.category.findUnique({
        where: { slug }
      });

      if (existing) {
        console.log(`  ⏭️  Category "${categoryData.name}" already exists`);
        createdParents.set(categoryData.name, existing);
      } else {
        const category = await prisma.category.create({
          data: {
            name: categoryData.name,
            description: categoryData.description,
            slug,
            displayOrder: categoryData.displayOrder,
            isActive: true,
          }
        });
        console.log(`  ✅ Created category: ${categoryData.name}`);
        createdParents.set(categoryData.name, category);
      }
    }

    // Create child categories
    console.log('\n📝 Creating child categories...');
    for (const categoryData of categoriesData) {
      const parent = createdParents.get(categoryData.name);
      
      if (!parent || !categoryData.children) continue;

      for (const childData of categoryData.children) {
        const slug = generateSlug(childData.name);
        
        const existing = await prisma.category.findUnique({
          where: { slug }
        });

        if (existing) {
          console.log(`  ⏭️  Category "${childData.name}" already exists`);
        } else {
          const child = await prisma.category.create({
            data: {
              name: childData.name,
              description: childData.description,
              slug,
              parentId: parent.id,
              displayOrder: childData.displayOrder,
              isActive: true,
            }
          });
          console.log(`  ✅ Created category: ${childData.name} (child of ${categoryData.name})`);
        }
      }
    }

    console.log('\n✨ Categories seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    throw error;
  }
}

// Export function without disconnect (for use in unified seed)
export async function seedCategories() {
  return _seedCategories();
}

// Allow running this file directly via tsx
const isMainModule = process.argv[1]?.includes('seed-categories.ts');

if (isMainModule) {
  (async () => {
    try {
      await _seedCategories();
      console.log('✅ Seed script completed');
    } catch (error) {
      console.error('❌ Seed script failed:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
      process.exit(0);
    }
  })();
}

