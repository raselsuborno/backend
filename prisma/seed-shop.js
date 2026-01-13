// Seed script for shop products and categories
// Run with: node prisma/seed-shop.js

import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const categories = [
  {
    name: "Home Care & Essentials",
    slug: "home-care-essentials",
    description: "Essential cleaning products for your home",
    imageUrl: null, // Can be added later
  },
  {
    name: "Automotive Cleaning",
    slug: "automotive-cleaning",
    description: "Professional car care and automotive cleaning products",
    imageUrl: null,
  },
  {
    name: "Corporate Cleaning Bundles",
    slug: "corporate-cleaning-bundles",
    description: "Bulk cleaning supplies and bundles for offices and businesses",
    imageUrl: null,
  },
  {
    name: "Airbnb Essentials",
    slug: "airbnb-essentials",
    description: "Essential supplies for short-term rental properties",
    imageUrl: null,
  },
];

const products = [
  // Home Care & Essentials
  {
    name: "Dish Wash Liquid — Citrus",
    slug: "dish-wash-liquid-citrus",
    description: "Concentrated grease-fighter, gentle on hands and tough on oil.",
    price: 5.99,
    categorySlug: "home-care-essentials",
    imageUrl: null, // "/assets/products/dishwash.png"
  },
  {
    name: "Multi-purpose Cleaner",
    slug: "multi-purpose-cleaner",
    description: "Streak-free cleaner for counters, glass, and sealed wood.",
    price: 6.49,
    categorySlug: "home-care-essentials",
    imageUrl: null, // "/assets/products/multipurpose.png"
  },
  {
    name: "Oven Cleaner Gel",
    slug: "oven-cleaner-gel",
    description: "Thick gel formula dissolves heavy baked-on grease fast.",
    price: 7.25,
    categorySlug: "home-care-essentials",
    imageUrl: null, // "/assets/products/oven-cleaner.png"
  },
  {
    name: "Household Bleach",
    slug: "household-bleach",
    description: "Powerful disinfectant and stain remover.",
    price: 4.99,
    categorySlug: "home-care-essentials",
    imageUrl: null, // "/assets/products/bleach.png"
  },
  {
    name: "Fabric Soap (Laundry)",
    slug: "fabric-soap-laundry",
    description: "Gentle high-performance laundry wash.",
    price: 8.49,
    categorySlug: "home-care-essentials",
    imageUrl: null, // "/assets/products/fabric-soap.png"
  },
  {
    name: "Air Freshener Spray",
    slug: "air-freshener-spray",
    description: "Neutralizes odors with a fresh citrus scent.",
    price: 5.25,
    categorySlug: "home-care-essentials",
    imageUrl: null, // "/assets/products/air-freshener.png"
  },
  // Automotive Cleaning
  {
    name: "Microfiber Towels — 3 pack",
    slug: "microfiber-towels-3pack",
    description: "Ultra-soft lint-free detailing towels.",
    price: 9.99,
    categorySlug: "automotive-cleaning",
    imageUrl: null, // "/assets/products/microfiber.png"
  },
  {
    name: "Car Wash Shampoo",
    slug: "car-wash-shampoo",
    description: "Foaming shampoo for a glossy finish.",
    price: 8.75,
    categorySlug: "automotive-cleaning",
    imageUrl: null, // "/assets/products/car-shampoo.png"
  },
  {
    name: "Car Air Freshener",
    slug: "car-air-freshener",
    description: "Long-lasting visor & vent scent packs.",
    price: 3.99,
    categorySlug: "automotive-cleaning",
    imageUrl: null, // "/assets/products/car-freshener.png"
  },
  // Corporate Cleaning Bundles
  {
    name: "Office Bulk Bundle",
    slug: "office-bulk-bundle",
    description: "Sanitizers, wipes, sprays & tissues in one kit.",
    price: 59.99,
    categorySlug: "corporate-cleaning-bundles",
    imageUrl: null, // "/assets/products/office-bundle.png"
  },
  {
    name: "Tissue Rolls — 20 pack",
    slug: "tissue-rolls-20pack",
    description: "High-capacity soft absorbent rolls.",
    price: 18.99,
    categorySlug: "corporate-cleaning-bundles",
    imageUrl: null, // "/assets/products/tissue-rolls.png"
  },
  // Airbnb Essentials
  {
    name: "Airbnb Host Starter Kit",
    slug: "airbnb-host-starter-kit",
    description: "Welcome essentials and mini toiletry packs.",
    price: 39.5,
    categorySlug: "airbnb-essentials",
    imageUrl: null, // "/assets/products/airbnb-kit.png"
  },
  {
    name: "Mini Condiment Pack",
    slug: "mini-condiment-pack",
    description: "Salt, pepper, sugar & tea — guest-friendly.",
    price: 9.49,
    categorySlug: "airbnb-essentials",
    imageUrl: null, // "/assets/products/mini-condiments.png"
  },
];

async function main() {
  console.log('🌱 Starting shop seed...\n');

  try {
    // Step 1: Create or update categories
    console.log('📦 Creating categories...');
    const createdCategories = {};

    for (const categoryData of categories) {
      const category = await prisma.productCategory.upsert({
        where: { slug: categoryData.slug },
        update: {
          name: categoryData.name,
          description: categoryData.description,
          imageUrl: categoryData.imageUrl,
          isActive: true,
        },
        create: {
          name: categoryData.name,
          slug: categoryData.slug,
          description: categoryData.description,
          imageUrl: categoryData.imageUrl,
          isActive: true,
        },
      });
      createdCategories[categoryData.slug] = category;
      console.log(`  ✓ ${category.name}`);
    }

    console.log(`\n✅ Created/updated ${Object.keys(createdCategories).length} categories\n`);

    // Step 2: Create or update products
    console.log('🛍️  Creating products...');
    let createdCount = 0;
    let updatedCount = 0;

    for (const productData of products) {
      const category = createdCategories[productData.categorySlug];
      
      if (!category) {
        console.error(`  ✗ Category not found for product: ${productData.name}`);
        continue;
      }

      const existingProduct = await prisma.product.findUnique({
        where: { slug: productData.slug },
      });

      if (existingProduct) {
        await prisma.product.update({
          where: { slug: productData.slug },
          data: {
            name: productData.name,
            description: productData.description,
            price: productData.price,
            categoryId: category.id,
            imageUrl: productData.imageUrl,
            isActive: true,
          },
        });
        updatedCount++;
        console.log(`  ↻ Updated: ${productData.name}`);
      } else {
        await prisma.product.create({
          data: {
            name: productData.name,
            slug: productData.slug,
            description: productData.description,
            price: productData.price,
            categoryId: category.id,
            imageUrl: productData.imageUrl,
            isActive: true,
          },
        });
        createdCount++;
        console.log(`  ✓ Created: ${productData.name}`);
      }
    }

    console.log(`\n✅ Created ${createdCount} products`);
    console.log(`✅ Updated ${updatedCount} products`);
    console.log(`\n🎉 Shop seed completed successfully!`);

  } catch (error) {
    console.error('❌ Error seeding shop data:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
