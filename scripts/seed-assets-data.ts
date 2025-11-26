import "dotenv/config";
import { prisma } from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

// Image paths - converted from imports to string paths
const imagePaths = {
  gs_logo: "/assets/gs_logo.jpg",
  happy_store: "/assets/happy_store.webp",
  upload_area: "/assets/upload_area.svg",
  hero_model_img: "/assets/hero_model_img.png",
  hero_product_img1: "/assets/hero_product_img1.png",
  hero_product_img2: "/assets/hero_product_img2.png",
  product_img1: "/assets/product_img1.png",
  product_img2: "/assets/product_img2.png",
  product_img3: "/assets/product_img3.png",
  product_img4: "/assets/product_img4.png",
  product_img5: "/assets/product_img5.png",
  product_img6: "/assets/product_img6.png",
  product_img7: "/assets/product_img7.png",
  product_img8: "/assets/product_img8.png",
  product_img9: "/assets/product_img9.png",
  product_img10: "/assets/product_img10.png",
  product_img11: "/assets/product_img11.png",
  product_img12: "/assets/product_img12.png",
  profile_pic1: "/assets/profile_pic1.jpg",
  profile_pic2: "/assets/profile_pic2.jpg",
  profile_pic3: "/assets/profile_pic3.jpg",
};

async function _seedAssetsData() {
  try {
    console.log('🌱 Seeding assets data...\n');

    // Generate UUIDs for all entities
    const userId1 = uuidv4();
    const userId2 = uuidv4();
    const userId3 = uuidv4();
    const ratingUserId1 = uuidv4();
    const ratingUserId2 = uuidv4();
    const ratingUserId3 = uuidv4();
    const storeId1 = uuidv4();
    const storeId2 = uuidv4();
    const storeId3 = uuidv4();
    const addressId = uuidv4();
    const orderId1 = uuidv4();
    const orderId2 = uuidv4();

    // 1. Create Users
    console.log('👤 Creating users...');
    const user1 = await prisma.user.upsert({
      where: { id: userId1 },
      update: {},
      create: {
        id: userId1,
        name: "Great Stack",
        email: "user.greatstack@gmail.com",
        image: imagePaths.gs_logo,
        cart: {},
      },
    });
    console.log(`  ✅ User: ${user1.name}`);

    const user2 = await prisma.user.upsert({
      where: { id: userId2 },
      update: {},
      create: {
        id: userId2,
        name: "GreatStack",
        email: "greatstack@example.com",
        image: imagePaths.gs_logo,
        cart: {},
      },
    });
    console.log(`  ✅ User: ${user2.name}`);

    // Create user for store2 (GreatStack store)
    const user3 = await prisma.user.upsert({
      where: { id: userId3 },
      update: {},
      create: {
        id: userId3,
        name: "GreatStack Store Owner",
        email: "greatstack.store@example.com",
        image: imagePaths.gs_logo,
        cart: {},
      },
    });
    console.log(`  ✅ User: ${user3.name}`);

    // Create additional users for ratings
    const ratingUsers = [
      { id: ratingUserId1, name: "Kristin Watson", email: "kristin@example.com", image: imagePaths.profile_pic1 },
      { id: ratingUserId2, name: "Jenny Wilson", email: "jenny@example.com", image: imagePaths.profile_pic2 },
      { id: ratingUserId3, name: "Bessie Cooper", email: "bessie@example.com", image: imagePaths.profile_pic3 },
    ];

    for (const userData of ratingUsers) {
      await prisma.user.upsert({
        where: { id: userData.id },
        update: {},
        create: userData,
      });
      console.log(`  ✅ User: ${userData.name}`);
    }

    // 2. Create Stores
    console.log('\n🏪 Creating stores...');
    const store1 = await prisma.store.upsert({
      where: { username: "happyshop" },
      update: {
        userId: user1.id,
        name: "Happy Shop",
        description: "At Happy Shop, we believe shopping should be simple, smart, and satisfying. Whether you're hunting for the latest fashion trends, top-notch electronics, home essentials, or unique lifestyle products — we've got it all under one digital roof.",
        address: "3rd Floor, Happy Shop , New Building, 123 street , c sector , NY, US",
        status: "approved",
        isActive: true,
        logo: imagePaths.happy_store,
        email: "happyshop@example.com",
        contact: "+0 1234567890",
      },
      create: {
        id: storeId1,
        userId: user1.id,
        name: "Happy Shop",
        description: "At Happy Shop, we believe shopping should be simple, smart, and satisfying. Whether you're hunting for the latest fashion trends, top-notch electronics, home essentials, or unique lifestyle products — we've got it all under one digital roof.",
        username: "happyshop",
        address: "3rd Floor, Happy Shop , New Building, 123 street , c sector , NY, US",
        status: "approved",
        isActive: true,
        logo: imagePaths.happy_store,
        email: "happyshop@example.com",
        contact: "+0 1234567890",
      },
    });
    console.log(`  ✅ Store: ${store1.name}`);

    const store2 = await prisma.store.upsert({
      where: { username: "greatstack" },
      update: {
        userId: user3.id,
        name: "GreatStack",
        description: "GreatStack is the education marketplace where you can buy goodies related to coding and tech",
        address: "123 Maplewood Drive Springfield, IL 62704 USA",
        status: "approved",
        isActive: true,
        logo: imagePaths.gs_logo,
        email: "greatstack@example.com",
        contact: "+0 1234567890",
      },
      create: {
        id: storeId2,
        userId: user3.id,
        name: "GreatStack",
        description: "GreatStack is the education marketplace where you can buy goodies related to coding and tech",
        username: "greatstack",
        address: "123 Maplewood Drive Springfield, IL 62704 USA",
        status: "approved",
        isActive: true,
        logo: imagePaths.gs_logo,
        email: "greatstack@example.com",
        contact: "+0 1234567890",
      },
    });
    console.log(`  ✅ Store: ${store2.name}`);

    const store3 = await prisma.store.upsert({
      where: { username: "happyshop2" },
      update: {
        userId: user2.id,
        name: "Happy Shop",
        description: "At Happy Shop, we believe shopping should be simple, smart, and satisfying. Whether you're hunting for the latest fashion trends, top-notch electronics, home essentials, or unique lifestyle products — we've got it all under one digital roof.",
        address: "3rd Floor, Happy Shop , New Building, 123 street , c sector , NY, US",
        status: "approved",
        isActive: true,
        logo: imagePaths.happy_store,
        email: "happyshop@example.com",
        contact: "+0 123456789",
      },
      create: {
        id: storeId3,
        userId: user2.id,
        name: "Happy Shop",
        description: "At Happy Shop, we believe shopping should be simple, smart, and satisfying. Whether you're hunting for the latest fashion trends, top-notch electronics, home essentials, or unique lifestyle products — we've got it all under one digital roof.",
        username: "happyshop2",
        address: "3rd Floor, Happy Shop , New Building, 123 street , c sector , NY, US",
        status: "approved",
        isActive: true,
        logo: imagePaths.happy_store,
        email: "happyshop@example.com",
        contact: "+0 123456789",
      },
    });
    console.log(`  ✅ Store: ${store3.name}`);

    // 3. Create Product Attributes and Values
    console.log('\n🏷️  Creating product attributes...');
    
    // Create Size attribute
    const sizeAttribute = await prisma.productAttribute.upsert({
      where: { name: 'size' },
      update: {},
      create: {
        name: 'size',
        displayName: 'Size',
        description: 'Product size variations',
        isActive: true,
      },
    });
    console.log(`  ✅ Attribute: ${sizeAttribute.displayName}`);

    // Create Color attribute
    const colorAttribute = await prisma.productAttribute.upsert({
      where: { name: 'color' },
      update: {},
      create: {
        name: 'color',
        displayName: 'Color',
        description: 'Product color variations',
        isActive: true,
      },
    });
    console.log(`  ✅ Attribute: ${colorAttribute.displayName}`);

    // Create Material attribute
    const materialAttribute = await prisma.productAttribute.upsert({
      where: { name: 'material' },
      update: {},
      create: {
        name: 'material',
        displayName: 'Material',
        description: 'Product material variations',
        isActive: true,
      },
    });
    console.log(`  ✅ Attribute: ${materialAttribute.displayName}`);

    // Create Size values
    const sizeValues = ['Small', 'Medium', 'Large', 'XL'];
    const createdSizeValues = [];
    for (const size of sizeValues) {
      const value = await prisma.productAttributeValue.upsert({
        where: {
          attributeId_value: {
            attributeId: sizeAttribute.id,
            value: size,
          },
        },
        update: {},
        create: {
          attributeId: sizeAttribute.id,
          value: size,
          displayValue: size,
          isActive: true,
        },
      });
      createdSizeValues.push(value);
      console.log(`  ✅ Size Value: ${value.value}`);
    }

    // Create Color values
    const colorValues = ['Red', 'Blue', 'Black', 'White', 'Green'];
    const createdColorValues = [];
    for (const color of colorValues) {
      const value = await prisma.productAttributeValue.upsert({
        where: {
          attributeId_value: {
            attributeId: colorAttribute.id,
            value: color,
          },
        },
        update: {},
        create: {
          attributeId: colorAttribute.id,
          value: color,
          displayValue: color,
          isActive: true,
        },
      });
      createdColorValues.push(value);
      console.log(`  ✅ Color Value: ${value.value}`);
    }

    // Create Material values
    const materialValues = ['Cotton', 'Polyester', 'Leather', 'Plastic'];
    const createdMaterialValues = [];
    for (const material of materialValues) {
      const value = await prisma.productAttributeValue.upsert({
        where: {
          attributeId_value: {
            attributeId: materialAttribute.id,
            value: material,
          },
        },
        update: {},
        create: {
          attributeId: materialAttribute.id,
          value: material,
          displayValue: material,
          isActive: true,
        },
      });
      createdMaterialValues.push(value);
      console.log(`  ✅ Material Value: ${value.value}`);
    }

    // 4. Create Products
    console.log('\n📦 Creating products...');
    const productIds = Array.from({ length: 15 }, () => uuidv4()); // Increased to 15 to include complex products
    // Products with prices in UGX (Ugandan Shillings)
    // Using sensible UGX values for demo data
    const products = [
      {
        id: productIds[0],
        name: "Modern table lamp",
        description: "Modern table lamp with a sleek design. It's perfect for any room. It's made of high-quality materials and comes with a lifetime warranty. Enhance your audio experience with this earbuds. Indulge yourself in a world of pure sound with 50 hours of uninterrupted playtime. Equipped with the cutting-edge Zen Mode Tech ENC and BoomX Tech, prepare to be enthralled by a symphony of crystal-clear melodies.",
        mrp: 148000,  // ~$40
        price: 107000,  // ~$29
        images: [imagePaths.product_img1, imagePaths.product_img2, imagePaths.product_img3, imagePaths.product_img4],
        category: "Decoration",
        storeId: store1.id,
        inStock: true,
      },
      {
        id: productIds[1],
        name: "Smart speaker gray",
        description: "Smart speaker with a sleek design. It's perfect for any room. It's made of high-quality materials and comes with a lifetime warranty.",
        mrp: 185000,  // ~$50
        price: 107000,  // ~$29
        images: [imagePaths.product_img2],
        category: "Speakers",
        storeId: store1.id,
        inStock: true,
      },
      {
        id: productIds[2],
        name: "Smart watch white",
        description: "Smart watch with a sleek design. It's perfect for any room. It's made of high-quality materials and comes with a lifetime warranty.",
        mrp: 222000,  // ~$60
        price: 107000,  // ~$29
        images: [imagePaths.product_img3],
        category: "Watch",
        storeId: store1.id,
        inStock: true,
      },
      {
        id: productIds[3],
        name: "Wireless headphones",
        description: "Wireless headphones with a sleek design. It's perfect for any room. It's made of high-quality materials and comes with a lifetime warranty.",
        mrp: 259000,  // ~$70
        price: 107000,  // ~$29
        images: [imagePaths.product_img4],
        category: "Headphones",
        storeId: store1.id,
        inStock: true,
      },
      {
        id: productIds[4],
        name: "Smart watch black",
        description: "Smart watch with a sleek design. It's perfect for any room. It's made of high-quality materials and comes with a lifetime warranty.",
        mrp: 181000,  // ~$49
        price: 107000,  // ~$29
        images: [imagePaths.product_img5],
        category: "Watch",
        storeId: store1.id,
        inStock: true,
      },
      {
        id: productIds[5],
        name: "Security Camera",
        description: "Security Camera with a sleek design. It's perfect for any room. It's made of high-quality materials and comes with a lifetime warranty.",
        mrp: 218000,  // ~$59
        price: 107000,  // ~$29
        images: [imagePaths.product_img6],
        category: "Camera",
        storeId: store1.id,
        inStock: true,
      },
      {
        id: productIds[6],
        name: "Smart Pen for iPad",
        description: "Smart Pen for iPad with a sleek design. It's perfect for any room. It's made of high-quality materials and comes with a lifetime warranty.",
        mrp: 329000,  // ~$89
        price: 107000,  // ~$29
        images: [imagePaths.product_img7],
        category: "Pen",
        storeId: store1.id,
        inStock: true,
      },
      {
        id: productIds[7],
        name: "Home Theater",
        description: "Home Theater with a sleek design. It's perfect for any room. It's made of high-quality materials and comes with a lifetime warranty.",
        mrp: 366000,  // ~$99
        price: 107000,  // ~$29
        images: [imagePaths.product_img8],
        category: "Theater",
        storeId: store1.id,
        inStock: true,
      },
      {
        id: productIds[8],
        name: "Apple Wireless Earbuds",
        description: "Apple Wireless Earbuds with a sleek design. It's perfect for any room. It's made of high-quality materials and comes with a lifetime warranty.",
        mrp: 329000,  // ~$89
        price: 107000,  // ~$29
        images: [imagePaths.product_img9],
        category: "Earbuds",
        storeId: store1.id,
        inStock: true,
      },
      {
        id: productIds[9],
        name: "Apple Smart Watch",
        description: "Apple Smart Watch with a sleek design. It's perfect for any room. It's made of high-quality materials and comes with a lifetime warranty.",
        mrp: 662000,  // ~$179
        price: 107000,  // ~$29
        images: [imagePaths.product_img10],
        category: "Watch",
        storeId: store1.id,
        inStock: true,
      },
      {
        id: productIds[10],
        name: "RGB Gaming Mouse",
        description: "RGB Gaming Mouse with a sleek design. It's perfect for any room. It's made of high-quality materials and comes with a lifetime warranty.",
        mrp: 144000,  // ~$39
        price: 107000,  // ~$29
        images: [imagePaths.product_img11],
        category: "Mouse",
        storeId: store1.id,
        inStock: true,
      },
      {
        id: productIds[11],
        name: "Smart Home Cleaner",
        description: "Smart Home Cleaner with a sleek design. It's perfect for any room. It's made of high-quality materials and comes with a lifetime warranty.",
        mrp: 736000,  // ~$199
        price: 107000,  // ~$29
        images: [imagePaths.product_img12],
        category: "Cleaner",
        storeId: store1.id,
        inStock: true,
        productType: 'SIMPLE',
      },
      // Complex products with variants
      {
        id: productIds[12],
        name: "Premium T-Shirt",
        description: "High-quality premium t-shirt available in multiple sizes and colors. Made from premium cotton for ultimate comfort.",
        mrp: 148000,  // ~$40
        price: 111000,  // ~$30
        images: [imagePaths.product_img1, imagePaths.product_img2],
        category: "Clothing",
        storeId: store1.id,
        inStock: true,
        productType: 'COMPLEX',
      },
      {
        id: productIds[13],
        name: "Designer Backpack",
        description: "Stylish designer backpack with multiple size and color options. Perfect for work, travel, or school.",
        mrp: 370000,  // ~$100
        price: 259000,  // ~$70
        images: [imagePaths.product_img3, imagePaths.product_img4],
        category: "Bags",
        storeId: store1.id,
        inStock: true,
        productType: 'COMPLEX',
      },
      {
        id: productIds[14],
        name: "Leather Wallet",
        description: "Premium leather wallet available in different colors and materials. Handcrafted with attention to detail.",
        mrp: 222000,  // ~$60
        price: 148000,  // ~$40
        images: [imagePaths.product_img5, imagePaths.product_img6],
        category: "Accessories",
        storeId: store1.id,
        inStock: true,
        productType: 'COMPLEX',
        },
    ];

    // Get default currency for products
    const defaultCurrency = await prisma.currency.findFirst({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });

    // Create simple products (all products that are not explicitly marked as COMPLEX)
    const simpleProducts = products.filter(p => p.productType !== 'COMPLEX');
    for (const productData of simpleProducts) {
      await prisma.product.upsert({
        where: { id: productData.id },
        update: {
          ...productData,
          productType: 'SIMPLE',
          currencyId: defaultCurrency?.id || null,
        },
        create: {
          ...productData,
          productType: 'SIMPLE',
          currencyId: defaultCurrency?.id || null,
        },
      });
      console.log(`  ✅ Product (Simple): ${productData.name}`);
    }

    // Create complex products with variants
    const complexProducts = products.filter(p => p.productType === 'COMPLEX');
    
    for (const productData of complexProducts) {
      // Determine which attributes this product needs
      const requiredAttributeIds = productData.name.includes('T-Shirt') || productData.name.includes('Backpack')
        ? [sizeAttribute.id, colorAttribute.id]
        : [colorAttribute.id, materialAttribute.id];

      // Create or update product
      const product = await prisma.product.upsert({
        where: { id: productData.id },
        update: {
          name: productData.name,
          description: productData.description,
          mrp: productData.mrp,
          price: productData.price,
          images: productData.images,
          category: productData.category,
          storeId: productData.storeId,
          inStock: productData.inStock,
          productType: 'COMPLEX',
          currencyId: defaultCurrency?.id || null,
        },
        create: {
          name: productData.name,
          description: productData.description,
          mrp: productData.mrp,
          price: productData.price,
          images: productData.images,
          category: productData.category,
          storeId: productData.storeId,
          inStock: productData.inStock,
          productType: 'COMPLEX',
          currencyId: defaultCurrency?.id || null,
          // Link attributes based on product
          attributes: {
            create: requiredAttributeIds.map(attributeId => ({
              attributeId,
            })),
          },
        },
        include: {
          attributes: {
            include: {
              attribute: {
                include: {
                  values: true,
                },
              },
            },
          },
        },
      });

      // Ensure attributes are linked (in case product was updated)
      const existingAttributes = await prisma.productAttributeMapping.findMany({
        where: { productId: product.id },
      });

      const existingAttributeIds = existingAttributes.map(a => a.attributeId);
      const missingAttributeIds = requiredAttributeIds.filter(id => !existingAttributeIds.includes(id));

      if (missingAttributeIds.length > 0) {
        await prisma.productAttributeMapping.createMany({
          data: missingAttributeIds.map(attributeId => ({
            productId: product.id,
            attributeId,
          })),
          skipDuplicates: true,
        });
      }

      // Generate variants based on product type
      let variants = [];
      
      if (productData.name.includes('T-Shirt')) {
        // T-Shirt: Size x Color combinations
        const sizes = createdSizeValues.slice(0, 3); // Small, Medium, Large
        const colors = createdColorValues.slice(0, 3); // Red, Blue, Black
        
        for (const size of sizes) {
          for (const color of colors) {
            const basePrice = productData.price;
            const sizeMultiplier = size.value === 'Small' ? 0.9 : size.value === 'Medium' ? 1.0 : 1.1;
            const colorMultiplier = color.value === 'Black' ? 1.05 : 1.0;
            
            variants.push({
              mrp: productData.mrp * sizeMultiplier * colorMultiplier,
              price: basePrice * sizeMultiplier * colorMultiplier,
              stock: Math.floor(Math.random() * 50) + 10,
              inStock: true,
              sku: `TSHIRT-${size.value.substring(0, 1)}-${color.value.substring(0, 1)}`,
              images: [],
              attributeValues: [size.id, color.id],
            });
          }
        }
      } else if (productData.name.includes('Backpack')) {
        // Backpack: Size x Color combinations
        const sizes = createdSizeValues.slice(0, 3); // Small, Medium, Large
        const colors = createdColorValues.slice(0, 4); // Red, Blue, Black, White
        
        for (const size of sizes) {
          for (const color of colors) {
            const basePrice = productData.price;
            const sizeMultiplier = size.value === 'Small' ? 0.85 : size.value === 'Medium' ? 1.0 : 1.15;
            
            variants.push({
              mrp: productData.mrp * sizeMultiplier,
              price: basePrice * sizeMultiplier,
              stock: Math.floor(Math.random() * 30) + 5,
              inStock: true,
              sku: `BAG-${size.value.substring(0, 1)}-${color.value.substring(0, 1)}`,
              images: [],
              attributeValues: [size.id, color.id],
            });
          }
        }
      } else if (productData.name.includes('Wallet')) {
        // Wallet: Color x Material combinations
        const colors = createdColorValues.slice(0, 4); // Red, Blue, Black, White
        const materials = createdMaterialValues.slice(2, 4); // Leather, Plastic
        
        for (const color of colors) {
          for (const material of materials) {
            const basePrice = productData.price;
            const materialMultiplier = material.value === 'Leather' ? 1.2 : 1.0;
            
            variants.push({
              mrp: productData.mrp * materialMultiplier,
              price: basePrice * materialMultiplier,
              stock: Math.floor(Math.random() * 40) + 10,
              inStock: true,
              sku: `WALLET-${color.value.substring(0, 1)}-${material.value.substring(0, 1)}`,
              images: [],
              attributeValues: [color.id, material.id],
            });
          }
        }
      }

      // Delete existing variants if any (for re-seeding)
      await prisma.productVariant.deleteMany({
        where: { productId: product.id },
      });

      // Create variants
      for (const variantData of variants) {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            sku: variantData.sku,
            mrp: variantData.mrp,
            price: variantData.price,
            stock: variantData.stock,
            inStock: variantData.inStock,
            images: variantData.images,
            attributes: {
              create: variantData.attributeValues.map((valueId) => ({
                valueId,
              })),
            },
          },
        });
      }
      
      console.log(`  ✅ Product (Complex): ${productData.name} with ${variants.length} variants`);
    }

    // 5. Create Address
    console.log('\n📍 Creating address...');
    const address = await prisma.address.upsert({
      where: { id: addressId },
      update: {},
      create: {
        id: addressId,
        userId: user2.id,
        name: "John Doe",
        email: "johndoe@example.com",
        street: "123 Main St",
        city: "New York",
        state: "NY",
        zip: "10001",
        country: "USA",
        phone: "1234567890",
      },
    });
    console.log(`  ✅ Address: ${address.name}`);

    // 6. Create Coupons
    console.log('\n🎫 Creating coupons...');
    const coupons = [
      { code: "NEW20", description: "20% Off for New Users", discount: 20, forNewUser: true, forMember: false, isPublic: false, expiresAt: new Date("2026-12-31T00:00:00.000Z") },
      { code: "NEW10", description: "10% Off for New Users", discount: 10, forNewUser: true, forMember: false, isPublic: false, expiresAt: new Date("2026-12-31T00:00:00.000Z") },
      { code: "OFF20", description: "20% Off for All Users", discount: 20, forNewUser: false, forMember: false, isPublic: false, expiresAt: new Date("2026-12-31T00:00:00.000Z") },
      { code: "OFF10", description: "10% Off for All Users", discount: 10, forNewUser: false, forMember: false, isPublic: false, expiresAt: new Date("2026-12-31T00:00:00.000Z") },
      { code: "PLUS10", description: "20% Off for Members", discount: 10, forNewUser: false, forMember: true, isPublic: false, expiresAt: new Date("2027-03-06T00:00:00.000Z") },
    ];

    for (const couponData of coupons) {
      await prisma.coupon.upsert({
        where: { code: couponData.code },
        update: couponData,
        create: couponData,
      });
      console.log(`  ✅ Coupon: ${couponData.code}`);
    }

    // 7. Create Orders (need to create orders before ratings since ratings require orderId)
    console.log('\n📋 Creating orders...');
    // Orders with prices in UGX
    const order1 = await prisma.order.upsert({
      where: { id: orderId1 },
      update: {},
      create: {
        id: orderId1,
        total: 792000,  // ~$214.2 in UGX
        status: "DELIVERED",
        userId: user2.id,
        storeId: store3.id,
        addressId: address.id,
        isPaid: false,
        paymentMethod: "COD",
        isCouponUsed: true,
        coupon: coupons[2],
        orderItems: {
          create: [
            { productId: products[0].id, quantity: 1, price: 329000 },  // ~$89
            { productId: products[1].id, quantity: 1, price: 551000 },  // ~$149
          ],
        },
      },
    });
    console.log(`  ✅ Order: ${order1.id}`);

    const order2 = await prisma.order.upsert({
      where: { id: orderId2 },
      update: {},
      create: {
        id: orderId2,
        total: 1559920,  // ~$421.6 in UGX
        status: "DELIVERED",
        userId: user2.id,
        storeId: store3.id,
        addressId: address.id,
        isPaid: false,
        paymentMethod: "COD",
        isCouponUsed: true,
        coupon: coupons[0],
        orderItems: {
          create: [
            { productId: products[2].id, quantity: 1, price: 847000 },  // ~$229
            { productId: products[3].id, quantity: 1, price: 366000 },  // ~$99
            { productId: products[4].id, quantity: 1, price: 736000 },  // ~$199
          ],
        },
      },
    });
    console.log(`  ✅ Order: ${order2.id}`);

    // 8. Create Ratings (ratings require orderId, so we use the orders we just created)
    console.log('\n⭐ Creating ratings...');
    const ratingIds = Array.from({ length: 6 }, () => uuidv4());
    const ratings = [
      { id: ratingIds[0], rating: 4, review: "I was a bit skeptical at first, but this product turned out to be even better than I imagined. The quality feels premium, it's easy to use, and it delivers exactly what was promised. I've already recommended it to friends and will definitely purchase again in the future.", userId: ratingUsers[0].id, productId: products[0].id, orderId: order1.id },
      { id: ratingIds[1], rating: 5, review: "This product is great. I love it!  You made it so simple. My new site is so much faster and easier to work with than my old site.", userId: ratingUsers[1].id, productId: products[1].id, orderId: order1.id },
      { id: ratingIds[2], rating: 4, review: "This product is amazing. I love it!  You made it so simple. My new site is so much faster and easier to work with than my old site.", userId: ratingUsers[2].id, productId: products[2].id, orderId: order2.id },
      { id: ratingIds[3], rating: 5, review: "This product is great. I love it!  You made it so simple. My new site is so much faster and easier to work with than my old site.", userId: ratingUsers[0].id, productId: products[3].id, orderId: order2.id },
      { id: ratingIds[4], rating: 4, review: "Overall, I'm very happy with this purchase. It works as described and feels durable. The only reason I didn't give it five stars is because of a small issue (such as setup taking a bit longer than expected, or packaging being slightly damaged). Still, highly recommend it for anyone looking for a reliable option.", userId: ratingUsers[1].id, productId: products[4].id, orderId: order2.id },
      { id: ratingIds[5], rating: 5, review: "This product is great. I love it!  You made it so simple. My new site is so much faster and easier to work with than my old site.", userId: ratingUsers[2].id, productId: products[5].id, orderId: order2.id },
    ];

    for (const ratingData of ratings) {
      await prisma.rating.upsert({
        where: { id: ratingData.id },
        update: ratingData,
        create: ratingData,
      });
      console.log(`  ✅ Rating: ${ratingData.id}`);
    }

    console.log('\n✨ Assets data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding assets data:', error);
    throw error;
  }
}

// Export function without disconnect (for use in unified seed)
export async function seedAssetsData() {
  return _seedAssetsData();
}

// Allow running this file directly via tsx
// This will only execute when the file is run directly, not when imported
const isMainModule = process.argv[1]?.includes('seed-assets-data.ts');

if (isMainModule) {
  (async () => {
    try {
      await _seedAssetsData();
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


