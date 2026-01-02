import prisma from '../../lib/prisma.js';

/**
 * Admin Users Controller
 * 
 * Manages customer/user operations for admins:
 * - View customer profiles
 * - View customer bookings
 * - Manual data corrections
 */
const usersController = {
  // GET /api/admin/users - Get all customers with pagination
  getAllUsers: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 20;
      const skip = (page - 1) * pageSize;
      const search = req.query.search;

      const where = { role: 'CUSTOMER' };
      
      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { fullName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.profile.findMany({
          where,
          select: {
            id: true,
            userId: true,
            fullName: true,
            email: true,
            phone: true,
            city: true,
            province: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: pageSize,
        }),
        prisma.profile.count({ where }),
      ]);

      // Get booking counts for each user
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          const [totalBookings, completedBookings] = await Promise.all([
            prisma.booking.count({
              where: { customerId: user.id },
            }),
            prisma.booking.count({
              where: { 
                customerId: user.id,
                status: 'COMPLETED',
              },
            }),
          ]);

          return {
            ...user,
            totalBookings,
            completedBookings,
          };
        })
      );

      res.json({
        users: usersWithStats,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      console.error('[Admin Users] Error in getAllUsers:', error);
      next(error);
    }
  },

  // GET /api/admin/users/:id - Get single user with full details
  getUser: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;

      const user = await prisma.profile.findUnique({
        where: { id },
        select: {
          id: true,
          userId: true,
          fullName: true,
          email: true,
          phone: true,
          street: true,
          unit: true,
          city: true,
          province: true,
          postal: true,
          country: true,
          profilePicUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Get user's addresses
      const addresses = await prisma.address.findMany({
        where: { profileId: id },
        orderBy: {
          isDefault: 'desc',
        },
      });

      // Get user's bookings
      const bookings = await prisma.booking.findMany({
        where: { customerId: id },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          assignedWorker: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
        take: 20, // Latest 20 bookings
      });

      // Get user's orders
      const orders = await prisma.order.findMany({
        where: { customerId: id },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10, // Latest 10 orders
      });

      res.json({
        ...user,
        addresses,
        bookings,
        orders,
      });
    } catch (error) {
      console.error('[Admin Users] Error in getUser:', error);
      next(error);
    }
  },

  // PATCH /api/admin/users/:id - Update user profile (manual corrections)
  updateUser: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;
      const { fullName, phone, city, province, postal, role } = req.body;

      // Only allow updating specific fields for manual corrections
      const updateData = {};

      if (fullName !== undefined) {
        updateData.fullName = fullName.trim() || null;
      }

      if (phone !== undefined) {
        updateData.phone = phone.trim() || null;
      }

      if (city !== undefined) {
        updateData.city = city.trim() || null;
      }

      if (province !== undefined) {
        updateData.province = province.trim() || null;
      }

      if (postal !== undefined) {
        updateData.postal = postal.trim() || null;
      }

      // Allow role updates (admin privilege)
      if (role !== undefined) {
        const validRoles = ['CUSTOMER', 'WORKER', 'ADMIN'];
        if (!validRoles.includes(role.toUpperCase())) {
          return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
        }
        updateData.role = role.toUpperCase();
      }

      const user = await prisma.profile.update({
        where: { id },
        data: updateData,
      });

      res.json({
        message: 'User profile updated successfully',
        user,
      });
    } catch (error) {
      console.error('[Admin Users] Error in updateUser:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'User not found' });
      }
      next(error);
    }
  },
};

export default usersController;

