import prisma from '../lib/prisma.js';

const addressesController = {
  // GET /api/addresses - Get all user addresses
  getAddresses: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      // Get user profile
      const profile = await prisma.profile.findUnique({
        where: { userId: req.user.id },
      });

      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      const addresses = await prisma.address.findMany({
        where: {
          profileId: profile.id,
          isActive: true,
        },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      res.json(addresses);
    } catch (error) {
      console.error('[Addresses] Error in getAddresses:', error);
      next(error);
    }
  },

  // GET /api/addresses/:id - Get address by ID
  getAddressById: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;

      // Get user profile
      const profile = await prisma.profile.findUnique({
        where: { userId: req.user.id },
      });

      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      const address = await prisma.address.findUnique({
        where: { id },
      });

      if (!address) {
        return res.status(404).json({ message: 'Address not found' });
      }

      if (address.profileId !== profile.id) {
        return res.status(403).json({ message: 'Not authorized to view this address' });
      }

      res.json(address);
    } catch (error) {
      console.error('[Addresses] Error in getAddressById:', error);
      next(error);
    }
  },

  // POST /api/addresses - Create new address
  createAddress: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const {
        label,
        fullName,
        phone,
        street,
        unit,
        city,
        province,
        postal,
        country,
        isDefault,
      } = req.body;

      // Get user profile
      const profile = await prisma.profile.findUnique({
        where: { userId: req.user.id },
      });

      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      // If setting as default, unset other defaults
      if (isDefault) {
        await prisma.address.updateMany({
          where: {
            profileId: profile.id,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      const address = await prisma.address.create({
        data: {
          profileId: profile.id,
          label: label || 'Home',
          fullName: fullName || profile.fullName,
          phone: phone || profile.phone,
          street,
          unit: unit || null,
          city,
          province,
          postal,
          country: country || 'Canada',
          isDefault: isDefault || false,
        },
      });

      res.status(201).json(address);
    } catch (error) {
      console.error('[Addresses] Error in createAddress:', error);
      next(error);
    }
  },

  // PUT /api/addresses/:id - Update address
  updateAddress: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;
      const updateData = req.body;

      // Get user profile
      const profile = await prisma.profile.findUnique({
        where: { userId: req.user.id },
      });

      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      // Check if address exists and belongs to user
      const existingAddress = await prisma.address.findUnique({
        where: { id },
      });

      if (!existingAddress) {
        return res.status(404).json({ message: 'Address not found' });
      }

      if (existingAddress.profileId !== profile.id) {
        return res.status(403).json({ message: 'Not authorized to update this address' });
      }

      // If setting as default, unset other defaults
      if (updateData.isDefault === true) {
        await prisma.address.updateMany({
          where: {
            profileId: profile.id,
            id: { not: id },
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      const address = await prisma.address.update({
        where: { id },
        data: updateData,
      });

      res.json(address);
    } catch (error) {
      console.error('[Addresses] Error in updateAddress:', error);
      next(error);
    }
  },

  // DELETE /api/addresses/:id - Delete address (soft delete)
  deleteAddress: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;

      // Get user profile
      const profile = await prisma.profile.findUnique({
        where: { userId: req.user.id },
      });

      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      // Check if address exists and belongs to user
      const existingAddress = await prisma.address.findUnique({
        where: { id },
      });

      if (!existingAddress) {
        return res.status(404).json({ message: 'Address not found' });
      }

      if (existingAddress.profileId !== profile.id) {
        return res.status(403).json({ message: 'Not authorized to delete this address' });
      }

      // Soft delete by setting isActive to false
      await prisma.address.update({
        where: { id },
        data: { isActive: false },
      });

      res.json({ message: 'Address deleted successfully' });
    } catch (error) {
      console.error('[Addresses] Error in deleteAddress:', error);
      next(error);
    }
  },

  // POST /api/addresses/:id/set-default - Set address as default
  setDefaultAddress: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;

      // Get user profile
      const profile = await prisma.profile.findUnique({
        where: { userId: req.user.id },
      });

      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      // Check if address exists and belongs to user
      const existingAddress = await prisma.address.findUnique({
        where: { id },
      });

      if (!existingAddress) {
        return res.status(404).json({ message: 'Address not found' });
      }

      if (existingAddress.profileId !== profile.id) {
        return res.status(403).json({ message: 'Not authorized to modify this address' });
      }

      // Unset all other defaults
      await prisma.address.updateMany({
        where: {
          profileId: profile.id,
          id: { not: id },
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });

      // Set this address as default
      const address = await prisma.address.update({
        where: { id },
        data: { isDefault: true },
      });

      res.json(address);
    } catch (error) {
      console.error('[Addresses] Error in setDefaultAddress:', error);
      next(error);
    }
  },
};

export default addressesController;


