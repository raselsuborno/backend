import prisma from '../../lib/prisma.js';

/**
 * Admin Service Options Controller
 * 
 * Manages service options (subservices, add-ons) for admins:
 * - Create service options
 * - Update service options
 * - Enable/disable options
 */
const serviceOptionsController = {
  // GET /api/admin/service-options - Get all options (optionally filtered by serviceId)
  getAllOptions: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { serviceId, isActive } = req.query;
      const where = {};

      if (serviceId) {
        where.serviceId = serviceId;
      }

      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      const options = await prisma.serviceOption.findMany({
        where,
        include: {
          service: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      res.json(options);
    } catch (error) {
      console.error('[Admin Service Options] Error in getAllOptions:', error);
      next(error);
    }
  },

  // GET /api/admin/service-options/:id - Get single option
  getOption: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;

      const option = await prisma.serviceOption.findUnique({
        where: { id },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      if (!option) {
        return res.status(404).json({ message: 'Service option not found' });
      }

      res.json(option);
    } catch (error) {
      console.error('[Admin Service Options] Error in getOption:', error);
      next(error);
    }
  },

  // POST /api/admin/service-options - Create new service option
  createOption: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { serviceId, name, description, price, priceModifier, isActive = true } = req.body;

      if (!serviceId || !name) {
        return res.status(400).json({ 
          message: 'Service ID and name are required' 
        });
      }

      // Verify service exists
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }

      // Validate price and priceModifier (cannot both be set)
      if (price !== null && price !== undefined && priceModifier !== null && priceModifier !== undefined) {
        return res.status(400).json({ 
          message: 'Cannot set both price and priceModifier. Use one or the other.' 
        });
      }

      const option = await prisma.serviceOption.create({
        data: {
          serviceId,
          name: name.trim(),
          description: description?.trim() || null,
          price: price !== undefined && price !== null ? parseFloat(price) : null,
          priceModifier: priceModifier !== undefined && priceModifier !== null ? parseFloat(priceModifier) : null,
          isActive: isActive === true || isActive === 'true',
        },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      res.status(201).json(option);
    } catch (error) {
      console.error('[Admin Service Options] Error in createOption:', error);
      if (error.code === 'P2003') {
        return res.status(404).json({ message: 'Service not found' });
      }
      next(error);
    }
  },

  // PATCH /api/admin/service-options/:id - Update service option
  updateOption: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;
      const { name, description, price, priceModifier, isActive } = req.body;

      const updateData = {};

      if (name !== undefined) {
        updateData.name = name.trim();
      }

      if (description !== undefined) {
        updateData.description = description?.trim() || null;
      }

      if (price !== undefined) {
        if (price === null) {
          updateData.price = null;
          // If setting price to null, also clear priceModifier if both were set
          if (priceModifier === undefined) {
            updateData.priceModifier = null;
          }
        } else {
          updateData.price = parseFloat(price);
          // Clear priceModifier if setting price
          updateData.priceModifier = null;
        }
      }

      if (priceModifier !== undefined) {
        if (priceModifier === null) {
          updateData.priceModifier = null;
          // If setting priceModifier to null, also clear price if both were set
          if (price === undefined) {
            updateData.price = null;
          }
        } else {
          updateData.priceModifier = parseFloat(priceModifier);
          // Clear price if setting priceModifier
          updateData.price = null;
        }
      }

      if (isActive !== undefined) {
        updateData.isActive = isActive === true || isActive === 'true';
      }

      const option = await prisma.serviceOption.update({
        where: { id },
        data: updateData,
        include: {
          service: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      res.json({
        message: 'Service option updated successfully',
        option,
      });
    } catch (error) {
      console.error('[Admin Service Options] Error in updateOption:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Service option not found' });
      }
      next(error);
    }
  },

  // DELETE /api/admin/service-options/:id - Delete service option
  deleteOption: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;

      await prisma.serviceOption.delete({
        where: { id },
      });

      res.json({ message: 'Service option deleted successfully' });
    } catch (error) {
      console.error('[Admin Service Options] Error in deleteOption:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Service option not found' });
      }
      next(error);
    }
  },
};

export default serviceOptionsController;


