import prisma from '../lib/prisma.js';

const servicesController = {
  // GET /api/public/services - Get all active services, optionally filtered by type
  getAllServices: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { type } = req.query; // RESIDENTIAL or CORPORATE

      const where = {
        isActive: true,
      };

      if (type) {
        where.type = type.toUpperCase();
      }

      const services = await prisma.service.findMany({
        where,
        include: {
          options: {
            where: { isActive: true },
            orderBy: { name: 'asc' },
          },
        },
        orderBy: [
          { isTrending: 'desc' }, // Trending services first
          { name: 'asc' },
        ],
      });

      // Format services for frontend
      const formattedServices = services.map((service) => ({
        id: service.id,
        slug: service.slug,
        title: service.name,
        name: service.name,
        description: service.description,
        image: service.imageUrl,
        imageUrl: service.imageUrl,
        iconName: service.iconName,
        isTrending: service.isTrending,
        type: service.type,
        bullets: service.options.map((opt) => opt.name), // Map options to bullets
        options: service.options,
        basePrice: service.basePrice,
        bookingBlocks: service.bookingBlocks || null, // Include configured booking blocks (null if not set)
      }));

      res.json(formattedServices);
    } catch (error) {
      console.error('[Services] Error in getAllServices:', error);
      next(error);
    }
  },

  getServiceById: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;

      // Try to find by ID first, then by slug
      let service = await prisma.service.findFirst({
        where: {
          OR: [
            { id },
            { slug: id },
          ],
          isActive: true,
        },
        include: {
          options: {
            where: { isActive: true },
            orderBy: { name: 'asc' },
          },
        },
      });

      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }

      // Format service for frontend
      const formattedService = {
        id: service.id,
        slug: service.slug,
        title: service.name,
        name: service.name,
        description: service.description,
        image: service.imageUrl,
        imageUrl: service.imageUrl,
        iconName: service.iconName,
        isTrending: service.isTrending,
        type: service.type,
        bullets: service.options.map((opt) => opt.name),
        basePrice: service.basePrice,
        options: service.options,
        bookingBlocks: service.bookingBlocks || null, // Include configured booking blocks (null if not set)
      };

      res.json(formattedService);
    } catch (error) {
      console.error('[Services] Error in getServiceById:', error);
      next(error);
    }
  }
};

export default servicesController;

