// Seed file for products
// Run with: node prisma/seed-products.js (after setting up Prisma)

const products = [
  // Home Care & Essentials
  {
    name: "Dish Wash Liquid — Citrus",
    slug: "dish-wash-liquid-citrus",
    description: "Concentrated grease-fighter, gentle on hands and tough on oil.",
    price: 5.99,
    category: "home-care",
  },
  {
    name: "Multi-purpose Cleaner",
    slug: "multi-purpose-cleaner",
    description: "Streak-free cleaner for counters, glass, and sealed wood.",
    price: 6.49,
    category: "home-care",
  },
  {
    name: "Oven Cleaner Gel",
    slug: "oven-cleaner-gel",
    description: "Thick gel formula dissolves heavy baked-on grease fast.",
    price: 7.25,
    category: "home-care",
  },
  {
    name: "Household Bleach",
    slug: "household-bleach",
    description: "Powerful disinfectant and stain remover.",
    price: 4.99,
    category: "home-care",
  },
  {
    name: "Fabric Soap (Laundry)",
    slug: "fabric-soap-laundry",
    description: "Gentle high-performance laundry wash.",
    price: 8.49,
    category: "home-care",
  },
  {
    name: "Air Freshener Spray",
    slug: "air-freshener-spray",
    description: "Neutralizes odors with a fresh citrus scent.",
    price: 5.25,
    category: "home-care",
  },
  // Automotive
  {
    name: "Microfiber Towels — 3 pack",
    slug: "microfiber-towels-3pack",
    description: "Streak-free cleaning for car interiors and exteriors.",
    price: 12.99,
    category: "automotive",
  },
  {
    name: "Car Shampoo",
    slug: "car-shampoo",
    description: "pH-balanced formula safe for all car finishes.",
    price: 9.99,
    category: "automotive",
  },
  {
    name: "Car Air Freshener",
    slug: "car-air-freshener",
    description: "Long-lasting scent for your vehicle interior.",
    price: 4.99,
    category: "automotive",
  },
  // Office & Bundles
  {
    name: "Office Bundle",
    slug: "office-bundle",
    description: "Everything you need to keep your office clean and fresh.",
    price: 45.99,
    category: "bundles",
  },
  {
    name: "Tissue Rolls — 12 pack",
    slug: "tissue-rolls-12pack",
    description: "Soft, absorbent tissue rolls for your home or office.",
    price: 14.99,
    category: "office",
  },
  {
    name: "Airbnb Kit",
    slug: "airbnb-kit",
    description: "Essential cleaning supplies for short-term rentals.",
    price: 39.99,
    category: "bundles",
  },
  {
    name: "Mini Condiments Set",
    slug: "mini-condiments-set",
    description: "Perfect for kitchens, offices, or small spaces.",
    price: 12.99,
    category: "office",
  },
];

export default products;


