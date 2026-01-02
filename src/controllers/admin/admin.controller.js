import prisma from '../../lib/prisma.js';

const adminController = {
  // GET /admin/stats - Get admin dashboard statistics
  getStats: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const [
        totalUsers,
        totalBookings,
        totalWorkers,
        pendingBookings,
        completedBookings,
        totalRevenue,
        newContactMessages,
        pendingWorkerApplications,
      ] = await Promise.all([
        prisma.profile.count({ where: { role: 'CUSTOMER' } }),
        prisma.booking.count(),
        prisma.profile.count({ where: { role: 'WORKER' } }),
        prisma.booking.count({ where: { status: 'PENDING' } }),
        prisma.booking.count({ where: { status: 'COMPLETED' } }),
        prisma.booking.aggregate({
          where: {
            paymentStatus: 'paid',
            totalAmount: { not: null },
          },
          _sum: {
            totalAmount: true,
          },
        }),
        prisma.contactMessage.count({ where: { status: 'NEW' } }),
        prisma.workerApplication.count({ where: { status: 'PENDING' } }),
      ]);

      res.json({
        totalUsers,
        totalBookings,
        totalWorkers,
        pendingBookings,
        completedBookings,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        newContactMessages,
        pendingWorkerApplications,
      });
    } catch (error) {
      console.error('[Admin] Error in getStats:', error);
      next(error);
    }
  },

  // GET /admin/bookings - Get all bookings with pagination
  getBookings: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 20;
      const skip = (page - 1) * pageSize;

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          include: {
            customer: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
              },
            },
            service: true,
            assignedWorker: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: pageSize,
        }),
        prisma.booking.count(),
      ]);

      res.json({
        bookings,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      console.error('[Admin] Error in getBookings:', error);
      next(error);
    }
  },

  // GET /admin/workers - Get all workers
  getWorkers: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const workers = await prisma.profile.findMany({
        where: { role: 'WORKER' },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          createdAt: true,
        },
        orderBy: {
          fullName: 'asc',
        },
      });

      // Get assignment counts for each worker
      const workersWithStats = await Promise.all(
        workers.map(async (worker) => {
          const assignments = await prisma.booking.count({
            where: { assignedWorkerId: worker.id },
          });
          return {
            ...worker,
            assignments,
          };
        })
      );

      res.json(workersWithStats);
    } catch (error) {
      console.error('[Admin] Error in getWorkers:', error);
      next(error);
    }
  },

  // GET /admin/users - Get all users with pagination (all roles)
  getUsers: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 20;
      const skip = (page - 1) * pageSize;
      const role = req.query.role; // Optional filter by role

      const where = role ? { role: role.toUpperCase() } : {};

      const [users, total] = await Promise.all([
        prisma.profile.findMany({
          where,
          select: {
            id: true,
            userId: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: pageSize,
        }),
        prisma.profile.count({ where }),
      ]);

      // Get booking counts for each user (in a separate query to avoid pool exhaustion)
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          const [totalBookings, completedBookings] = await Promise.all([
            prisma.booking.count({ where: { customerId: user.id } }),
            prisma.booking.count({ where: { customerId: user.id, status: 'COMPLETED' } }),
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
      console.error('[Admin] Error in getUsers:', error);
      next(error);
    }
  },

  // POST /admin/bookings/:id/assign - Assign worker to booking
  assignWorker: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;
      const { workerId } = req.body;

      if (!workerId) {
        return res.status(400).json({ message: 'Worker ID is required' });
      }

      // Verify worker exists and is a worker
      const worker = await prisma.profile.findUnique({
        where: { id: workerId },
      });

      if (!worker || worker.role !== 'WORKER') {
        return res.status(404).json({ message: 'Worker not found' });
      }

      // Get booking
      const booking = await prisma.booking.findUnique({
        where: { id },
      });

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Update booking with worker assignment
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          assignedWorkerId: workerId,
          status: 'ASSIGNED', // Update status to ASSIGNED
        },
        include: {
          assignedWorker: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      res.json({
        message: 'Worker assigned successfully',
        booking: updatedBooking,
      });
    } catch (error) {
      console.error('[Admin] Error in assignWorker:', error);
      next(error);
    }
  },

  // PUT /admin/bookings/:id/unassign - Unassign worker from booking
  unassignWorker: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;

      const booking = await prisma.booking.findUnique({
        where: { id },
      });

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Update booking to remove worker assignment
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          assignedWorkerId: null,
          status: booking.status === 'ASSIGNED' ? 'CONFIRMED' : booking.status,
        },
      });

      res.json({
        message: 'Worker unassigned successfully',
        booking: updatedBooking,
      });
    } catch (error) {
      console.error('[Admin] Error in unassignWorker:', error);
      next(error);
    }
  },

  // GET /admin/contact - Get all contact messages
  getContactMessages: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { status, page = 1, limit = 50 } = req.query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const where = status ? { status: status.toUpperCase() } : {};

      const [messages, total, newCount] = await Promise.all([
        prisma.contactMessage.findMany({
          where,
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limitNum,
        }),
        prisma.contactMessage.count({ where }),
        prisma.contactMessage.count({ where: { status: 'NEW' } }),
      ]);

      res.json({
        messages,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
        stats: {
          newCount,
        },
      });
    } catch (error) {
      console.error('[Admin] Error in getContactMessages:', error);
      next(error);
    }
  },
};

export default adminController;

