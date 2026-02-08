import prisma from '../../lib/prisma.js';

const adminController = {
  // GET /admin/stats - Get admin dashboard statistics
  getStats: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      // Use string literals - Prisma accepts both enum values and strings
      const CustomerRole = 'CUSTOMER';
      const WorkerRole = 'WORKER';
      const PendingStatus = 'PENDING';
      const CompletedStatus = 'COMPLETED';
      const AssignedStatus = 'ASSIGNED';
      const AcceptedStatus = 'ACCEPTED';
      const InProgressStatus = 'IN_PROGRESS';
      const PendingAppStatus = 'PENDING';

      // Wrap all queries in try-catch to handle any Prisma errors
      let totalUsers = 0, totalBookings = 0, totalWorkers = 0;
      let pendingBookings = 0, assignedBookings = 0, completedBookings = 0;
      let totalRevenue = { _sum: { totalAmount: 0 } };
      let newContactMessages = 0, pendingWorkerApplications = 0;

      try {
        const results = await Promise.allSettled([
          prisma.profile.count({ where: { role: CustomerRole } }),
          prisma.booking.count(),
          prisma.profile.count({ where: { role: WorkerRole } }),
          prisma.booking.count({ where: { status: PendingStatus } }),
          prisma.booking.count({ 
            where: { 
              status: { in: [AssignedStatus, AcceptedStatus, InProgressStatus] },
              assignedWorkerId: { not: null }
            } 
          }),
          prisma.booking.count({ where: { status: CompletedStatus } }),
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
          prisma.workerApplication.count({ where: { status: PendingAppStatus } }),
        ]);

        // Extract results, handling both fulfilled and rejected promises
        totalUsers = results[0].status === 'fulfilled' ? results[0].value : 0;
        totalBookings = results[1].status === 'fulfilled' ? results[1].value : 0;
        totalWorkers = results[2].status === 'fulfilled' ? results[2].value : 0;
        pendingBookings = results[3].status === 'fulfilled' ? results[3].value : 0;
        assignedBookings = results[4].status === 'fulfilled' ? results[4].value : 0;
        completedBookings = results[5].status === 'fulfilled' ? results[5].value : 0;
        totalRevenue = results[6].status === 'fulfilled' ? results[6].value : { _sum: { totalAmount: 0 } };
        newContactMessages = results[7].status === 'fulfilled' ? results[7].value : 0;
        pendingWorkerApplications = results[8].status === 'fulfilled' ? results[8].value : 0;

        // Log any failures
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`[Admin] Query ${index} failed:`, result.reason);
          }
        });
      } catch (err) {
        console.error('[Admin] Error in Promise.allSettled:', err);
        // Continue with default values (already set above)
      }

      // Return structure matching frontend expectations
      const statsData = {
        users: {
          total: totalUsers || 0,
        },
        workers: {
          total: totalWorkers || 0,
        },
        bookings: {
          total: totalBookings || 0,
          pending: pendingBookings || 0,
          assigned: assignedBookings || 0,
          completed: completedBookings || 0,
        },
        revenue: {
          total: totalRevenue?._sum?.totalAmount || 0,
        },
        contact: {
          newMessages: newContactMessages || 0,
        },
        applications: {
          pending: pendingWorkerApplications || 0,
        },
        // Keep flat structure for backward compatibility
        totalUsers: totalUsers || 0,
        totalBookings: totalBookings || 0,
        totalWorkers: totalWorkers || 0,
        pendingBookings: pendingBookings || 0,
        assignedBookings: assignedBookings || 0,
        completedBookings: completedBookings || 0,
        totalRevenue: totalRevenue?._sum?.totalAmount || 0,
        newContactMessages: newContactMessages || 0,
        pendingWorkerApplications: pendingWorkerApplications || 0,
      };

      console.log('[Admin] Stats loaded successfully:', statsData);
      res.json(statsData);
    } catch (error) {
      console.error('[Admin] Error in getStats:', error);
      console.error('[Admin] Error stack:', error.stack);
      console.error('[Admin] Error message:', error.message);
      
      // Return default stats structure instead of throwing error
      // This prevents the frontend from crashing
      return res.status(200).json({
        users: { total: 0 },
        workers: { total: 0 },
        bookings: { total: 0, pending: 0, assigned: 0, completed: 0 },
        revenue: { total: 0 },
        contact: { newMessages: 0 },
        applications: { pending: 0 },
        totalUsers: 0,
        totalBookings: 0,
        totalWorkers: 0,
        pendingBookings: 0,
        assignedBookings: 0,
        completedBookings: 0,
        totalRevenue: 0,
        newContactMessages: 0,
        pendingWorkerApplications: 0,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
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
          select: {
            id: true,
            status: true,
            customerId: true,
            guestEmail: true,
            guestName: true,
            guestPhone: true,
            assignedWorkerId: true,
            serviceId: true,
            serviceName: true,
            serviceSlug: true,
            subService: true,
            frequency: true,
            date: true,
            timeSlot: true,
            addressLine: true,
            city: true,
            province: true,
            postal: true,
            country: true,
            notes: true,
            totalAmount: true,
            isFavorite: true,
            paymentMethod: true,
            paymentStatus: true,
            paidAt: true,
            createdAt: true,
            updatedAt: true,
            customer: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
              },
            },
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
            createdAt: 'desc',
          },
          skip,
          take: pageSize,
        }).catch((err) => {
          console.error('[Admin] Error in getBookings findMany:', err);
          return [];
        }),
        prisma.booking.count().catch(() => 0),
      ]);

      res.json({
        bookings: bookings || [],
        pagination: {
          page,
          pageSize,
          total: total || 0,
          totalPages: Math.ceil((total || 0) / pageSize),
        },
      });
    } catch (error) {
      console.error('[Admin] Error in getBookings:', error);
      console.error('[Admin] Error stack:', error.stack);
      // Return empty result instead of 500 error
      return res.status(200).json({
        bookings: [],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 0,
          totalPages: 0,
        },
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
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
      console.error('[Admin] Error stack:', error.stack);
      // Return empty result instead of 500 error
      return res.status(200).json({
        users: [],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 0,
          totalPages: 0,
        },
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
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
      console.error('[Admin] Error stack:', error.stack);
      // Return empty result instead of 500 error
      return res.status(200).json({
        messages: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
        },
        newCount: 0,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  },
};

export default adminController;

