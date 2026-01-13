import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const RESIDENTIAL_SERVICES = [
  {
    name: "Cleaning",
    slug: "cleaning",
    type: "RESIDENTIAL",
    iconName: "Brush",
    description: "From quick tidy-ups to deep cleaning that resets your home.",
    imageUrl: "https://images.unsplash.com/photo-1758273705627-937374bfa978?q=80&w=1200&auto=format&fit=crop",
    isTrending: true,
    basePrice: 80.00,
    isActive: true,
    options: [
      "Home & apartment cleaning",
      "After-party & post-renovation",
      "Carpet and exterior cleaning",
    ],
  },
  {
    name: "Maid Service",
    slug: "maid",
    type: "RESIDENTIAL",
    iconName: "UserCheck",
    description: "Regular help to keep life moving smoothly.",
    imageUrl: "https://images.unsplash.com/photo-1643213410761-879689e61a7a?q=80&w=1200&auto=format&fit=crop",
    basePrice: 60.00,
    isActive: true,
    options: [
      "Tidy, dishes, mop & vacuum",
      "Surface dusting & light organizing",
      "Hourly or recurring visits",
    ],
  },
  {
    name: "Laundry Service",
    slug: "laundry",
    type: "RESIDENTIAL",
    iconName: "Shirt",
    description: "Drop the baskets, keep the fresh clothes.",
    imageUrl: "https://images.unsplash.com/photo-1761403460807-a89b7de9b4d3?q=80&w=1200&auto=format&fit=crop",
    basePrice: 25.00,
    isActive: true,
    options: [
      "Pickup & delivery",
      "Folding and sorting",
      "Monthly laundry passes",
    ],
  },
  {
    name: "Lawn Care",
    slug: "lawn",
    type: "RESIDENTIAL",
    iconName: "Trees",
    description: "Keep the yard as clean as the inside.",
    imageUrl: "https://images.unsplash.com/photo-1738193830098-2d92352a1856?q=80&w=1200&auto=format&fit=crop",
    basePrice: 50.00,
    isActive: true,
    options: [
      "Lawn mowing & edging",
      "Weed control",
      "Sodding and light landscaping",
    ],
  },
  {
    name: "Handyman",
    slug: "handyman",
    type: "RESIDENTIAL",
    iconName: "Wrench",
    description: "Small jobs done right without calling five different people.",
    imageUrl: "https://images.unsplash.com/photo-1584677191047-38f48d0db64e?q=80&w=1200&auto=format&fit=crop",
    basePrice: 75.00,
    isActive: true,
    options: [
      "Furniture assembly & mounting",
      "Blind & curtain install",
      "Appliance install help",
    ],
  },
  {
    name: "Home Renovation",
    slug: "reno",
    type: "RESIDENTIAL",
    iconName: "Hammer",
    description: "Bigger projects with the right pros.",
    imageUrl: "https://images.unsplash.com/photo-1765277789236-18b14cb7869f?q=80&w=1200&auto=format&fit=crop",
    basePrice: 200.00,
    isActive: true,
    options: [
      "Kitchen & bathroom upgrades",
      "Basement finishing",
      "Flooring, painting, repairs",
    ],
  },
  {
    name: "Pest Control",
    slug: "pest",
    type: "RESIDENTIAL",
    iconName: "Bug",
    description: "Keep your home clear of unwanted guests.",
    imageUrl: "https://images.unsplash.com/photo-1622906608804-6c6ce517a6f0?q=80&w=1200&auto=format&fit=crop",
    basePrice: 100.00,
    isActive: true,
    options: [
      "Inspection & assessment",
      "Ants, spiders, crawling insects",
      "Rodent treatment plans",
    ],
  },
  {
    name: "Snow Removal",
    slug: "snow",
    type: "RESIDENTIAL",
    iconName: "Snowflake",
    description: "Saskatchewan winters, handled for you.",
    imageUrl: "https://images.unsplash.com/photo-1732645556381-161e81915288?q=80&w=1200&auto=format&fit=crop",
    basePrice: 40.00,
    isActive: true,
    options: [
      "Driveways & walkways cleared",
      "Small parking areas",
      "Subscription passes",
    ],
  },
  {
    name: "Move-In / Move-Out",
    slug: "move",
    type: "RESIDENTIAL",
    iconName: "Truck",
    description: "Stress-free moves with proper cleaning and lifting help.",
    imageUrl: "https://images.unsplash.com/photo-1758523671413-cd178a883d6a?q=80&w=1200&auto=format&fit=crop",
    basePrice: 150.00,
    isActive: true,
    options: [
      "Deep move-in / move-out clean",
      "Packing and light loading help",
      "Garbage / clutter removal",
    ],
  },
  {
    name: "Vacation Home / Airbnb",
    slug: "airbnb",
    type: "RESIDENTIAL",
    iconName: "Home",
    description: "Turnovers that keep your guests happy and ratings high.",
    imageUrl: "https://images.unsplash.com/photo-1521783593447-5702b9bfd267?q=80&w=1200&auto=format&fit=crop",
    basePrice: 90.00,
    isActive: true,
    options: [
      "Per-stay clean & reset",
      "Restocking condiments & essentials",
      "Bedsheets / towel laundry help",
    ],
  },
  {
    name: "Automotive",
    slug: "auto",
    type: "RESIDENTIAL",
    iconName: "Car",
    description: "Car chores handled without waiting rooms.",
    imageUrl: "https://images.unsplash.com/photo-1657388986018-409dc7dce28c?q=80&w=1200&auto=format&fit=crop",
    basePrice: 70.00,
    isActive: true,
    options: [
      "Inside–out detailing",
      "Seasonal tire change at home",
      "Oil change & basic tune-up",
    ],
  },
  {
    name: "Heating, Cooling & Plumbing",
    slug: "trades",
    type: "RESIDENTIAL",
    iconName: "Thermometer",
    description: "Trusted trades for the systems that matter.",
    imageUrl: "https://images.unsplash.com/photo-1751486289950-5c4898a4c773?q=80&w=1200&auto=format&fit=crop",
    basePrice: 120.00,
    isActive: true,
    options: [
      "Heating & cooling support",
      "Plumbing & minor electrical",
      "Water heater service",
    ],
  },
];

const CORPORATE_SERVICES = [
  {
    name: "Commercial Cleaning",
    slug: "corp-cleaning",
    type: "CORPORATE",
    iconName: "Brush",
    description: "Scheduled cleaning tailored for offices, stores, and common areas.",
    imageUrl: "https://images.unsplash.com/photo-1758273705627-937374bfa978?q=80&w=1200&auto=format&fit=crop",
    basePrice: 200.00,
    isActive: true,
    options: [
      "Office & retail cleaning",
      "Janitorial & common area care",
      "Post-construction / turnover cleans",
    ],
  },
  {
    name: "Commercial Snow Removal",
    slug: "corp-snow",
    type: "CORPORATE",
    iconName: "Snowflake",
    description: "Keep access safe for staff, tenants, and customers.",
    imageUrl: "https://images.unsplash.com/photo-1732645556381-161e81915288?q=80&w=1200&auto=format&fit=crop",
    basePrice: 150.00,
    isActive: true,
    options: [
      "Lots, walkways & entrances",
      "Seasonal contracts",
      "Salt & sanding add-ons",
    ],
  },
  {
    name: "Commercial Landscaping",
    slug: "corp-landscape",
    type: "CORPORATE",
    iconName: "Trees",
    description: "Clean, consistent outdoor presentation for your property.",
    imageUrl: "https://images.unsplash.com/photo-1738193830098-2d92352a1856?q=80&w=1200&auto=format&fit=crop",
    basePrice: 180.00,
    isActive: true,
    options: [
      "Groundskeeping & mowing",
      "Weed care & trimming",
      "Seasonal cleanups",
    ],
  },
  {
    name: "Facility Maintenance",
    slug: "corp-facility",
    type: "CORPORATE",
    iconName: "ClipboardList",
    description: "One point of contact for everyday fixes and upkeep.",
    imageUrl: "https://images.unsplash.com/photo-1719005764706-9805b8f8eb81?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    basePrice: 150.00,
    isActive: true,
    options: [
      "Handyman and fixture repairs",
      "Appliance installs & minor trades",
      "HVAC, plumbing & electrical partners",
    ],
  },
  {
    name: "Commercial Renovation",
    slug: "corp-reno",
    type: "CORPORATE",
    iconName: "Building2",
    description: "Refresh workspaces and tenant areas with minimal disruption.",
    imageUrl: "https://images.unsplash.com/photo-1765277789236-18b14cb7869f?q=80&w=1200&auto=format&fit=crop",
    basePrice: 500.00,
    isActive: true,
    options: [
      "Office & retail refresh",
      "Flooring and repainting",
      "Light reconfiguration work",
    ],
  },
];

async function main() {
  console.log('🌱 Seeding services...');

  // Seed residential services
  for (const serviceData of RESIDENTIAL_SERVICES) {
    const { options, ...serviceFields } = serviceData;
    
    // Check if service already exists
    const existing = await prisma.service.findUnique({
      where: { slug: serviceData.slug },
    });

    if (existing) {
      console.log(`⏭️  Service "${serviceData.name}" already exists, skipping...`);
      continue;
    }

    const service = await prisma.service.create({
      data: {
        ...serviceFields,
        options: {
          create: options.map((name) => ({
            name,
            isActive: true,
          })),
        },
      },
    });

    console.log(`✅ Created service: ${service.name}`);
  }

  // Seed corporate services
  for (const serviceData of CORPORATE_SERVICES) {
    const { options, ...serviceFields } = serviceData;
    
    // Check if service already exists
    const existing = await prisma.service.findUnique({
      where: { slug: serviceData.slug },
    });

    if (existing) {
      console.log(`⏭️  Service "${serviceData.name}" already exists, skipping...`);
      continue;
    }

    const service = await prisma.service.create({
      data: {
        ...serviceFields,
        options: {
          create: options.map((name) => ({
            name,
            isActive: true,
          })),
        },
      },
    });

    console.log(`✅ Created service: ${service.name}`);
  }

  console.log('✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding services:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
