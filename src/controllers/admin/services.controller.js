import prisma from '../../lib/prisma.js';

/**
 * Admin Services Controller
 * 
 * Manages service operations for admins:
 * - CRUD operations for services
 * - Service options (subservices)
 * - Dynamic pricing
 */
const servicesController = {
  // GET /api/admin/services - Get all services
  getAllServices: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { isActive } = req.query;
      const where = {};
      
      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      const services = await prisma.service.findMany({
        where,
        include: {
          options: {
            where: { isActive: true },
            orderBy: { name: 'asc' },
          },
          _count: {
            select: {
              bookings: true,
              options: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      res.json(services);
    } catch (error) {
      console.error('[Admin Services] Error in getAllServices:', error);
      next(error);
    }
  },

  // GET /api/admin/services/:id - Get single service
  getService: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;

      const service = await prisma.service.findUnique({
        where: { id },
        include: {
          options: {
            orderBy: { name: 'asc' },
          },
          _count: {
            select: {
              bookings: true,
              options: true,
            },
          },
        },
      });

      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }

      res.json(service);
    } catch (error) {
      console.error('[Admin Services] Error in getService:', error);
      next(error);
    }
  },

  // POST /api/admin/services - Create new service
  createService: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { name, slug, description, basePrice, isActive = true } = req.body;

      if (!name || !slug) {
        return res.status(400).json({ 
          message: 'Name and slug are required' 
        });
      }

      // Validate slug format (lowercase, hyphens only)
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(slug)) {
        return res.status(400).json({ 
          message: 'Slug must contain only lowercase letters, numbers, and hyphens' 
        });
      }

      // Check if slug already exists
      const existingService = await prisma.service.findUnique({
        where: { slug },
      });

      if (existingService) {
        return res.status(409).json({ 
          message: 'Service with this slug already exists' 
        });
      }

      const service = await prisma.service.create({
        data: {
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          description: description?.trim() || null,
          basePrice: basePrice !== undefined && basePrice !== null ? parseFloat(basePrice) : null,
          isActive: isActive === true || isActive === 'true',
        },
      });

      res.status(201).json(service);
    } catch (error) {
      console.error('[Admin Services] Error in createService:', error);
      if (error.code === 'P2002') {
        return res.status(409).json({ message: 'Service slug already exists' });
      }
      next(error);
    }
  },

  // PATCH /api/admin/services/:id - Update service
  updateService: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;
      const { name, slug, description, basePrice, isActive } = req.body;

      const updateData = {};

      if (name !== undefined) {
        updateData.name = name.trim();
      }

      if (slug !== undefined) {
        // Validate slug format
        const slugRegex = /^[a-z0-9-]+$/;
        if (!slugRegex.test(slug)) {
          return res.status(400).json({ 
            message: 'Slug must contain only lowercase letters, numbers, and hyphens' 
          });
        }

        // Check if slug is already taken by another service
        const existingService = await prisma.service.findUnique({
          where: { slug: slug.trim().toLowerCase() },
        });

        if (existingService && existingService.id !== id) {
          return res.status(409).json({ 
            message: 'Service with this slug already exists' 
          });
        }

        updateData.slug = slug.trim().toLowerCase();
      }

      if (description !== undefined) {
        updateData.description = description?.trim() || null;
      }

      if (basePrice !== undefined) {
        updateData.basePrice = basePrice !== null && basePrice !== undefined ? parseFloat(basePrice) : null;
      }

      if (isActive !== undefined) {
        updateData.isActive = isActive === true || isActive === 'true';
      }

      const service = await prisma.service.update({
        where: { id },
        data: updateData,
      });

      res.json({
        message: 'Service updated successfully',
        service,
      });
    } catch (error) {
      console.error('[Admin Services] Error in updateService:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Service not found' });
      }
      if (error.code === 'P2002') {
        return res.status(409).json({ message: 'Service slug already exists' });
      }
      next(error);
    }
  },

  // DELETE /api/admin/services/:id - Delete service (soft delete by setting isActive=false)
  deleteService: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;

      // Check if service has bookings
      const bookingCount = await prisma.booking.count({
        where: { serviceId: id },
      });

      if (bookingCount > 0) {
        // Soft delete: just deactivate instead of deleting
        const service = await prisma.service.update({
          where: { id },
          data: { isActive: false },
        });

        return res.json({
          message: 'Service deactivated (has existing bookings)',
          service,
        });
      }

      // Hard delete if no bookings
      await prisma.service.delete({
        where: { id },
      });

      res.json({ message: 'Service deleted successfully' });
    } catch (error) {
      console.error('[Admin Services] Error in deleteService:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Service not found' });
      }
      next(error);
    }
  },
};

export default servicesController;

