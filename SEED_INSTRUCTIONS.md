# Database Seeding Instructions

## Products Seed
The products seed file has been created at `prisma/seed-products.js`. To seed products:

1. Run Prisma migrations first:
   ```bash
   cd backend
   npx prisma migrate dev
   ```

2. Create a seed script (add to `package.json`):
   ```json
   "prisma": {
     "seed": "node prisma/seed-products.js"
   }
   ```

3. Or manually seed:
   ```bash
   node -e "
   import('prisma/client').then(async ({ PrismaClient }) => {
     const prisma = new PrismaClient();
     const products = await import('./prisma/seed-products.js');
     for (const product of products.default) {
       await prisma.product.upsert({
         where: { slug: product.slug },
         update: {},
         create: product,
       });
     }
     console.log('Products seeded successfully!');
     await prisma.$disconnect();
   });
   "
   ```

## Current Product List
- Home Care & Essentials (6 products)
- Automotive Cleaning (3 products)  
- Office & Bundles (4 products)
- Total: 13 products


