import prisma from '../../lib/prisma.js';

/**
 * Admin Analytics Controller
 * 
 * Provides business insights and metrics for admin dashboard.
 * All queries use efficient Prisma aggregations (groupBy, count, sum).
 * 
 * Future enhancements:
 * - Date range filtering
 * - CSV export functionality
 * - Payment provider integration
 * - Caching for frequently accessed metrics
 */
const analyticsController = {
  // GET /api/admin/analytics/overview - Get high-level overview metrics
  getOverview: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      // Date calculations
      const now = new Date();
      const startOfToday = new Date(now.setHours(0, 0, 0, 0));
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)

      // Reduce parallel queries to avoid pool exhaustion - execute in batches
      const [
        totalBookings,
        bookingsToday,
        bookingsThisWeek,
        completedBookings,
        cancelledBookings,
      ] = await Promise.all([
        prisma.booking.count(),
        prisma.booking.count({ where: { createdAt: { gte: startOfToday } } }),
        prisma.booking.count({ where: { createdAt: { gte: startOfWeek } } }),
        prisma.booking.count({ where: { status: 'COMPLETED' } }),
        prisma.booking.count({ where: { status: 'CANCELLED' } }),
      ]);

      // Batch 2: Revenue and workers
      const [totalRevenue, avgBookingValue, totalWorkers, totalServices, activeServices] = await Promise.all([
        prisma.booking.aggregate({
          where: { status: 'COMPLETED', totalAmount: { not: null } },
          _sum: { totalAmount: true },
        }),
        prisma.booking.aggregate({
          where: { status: 'COMPLETED', totalAmount: { not: null } },
          _avg: { totalAmount: true },
          _count: { totalAmount: true },
        }),
        prisma.profile.count({ where: { role: 'WORKER' } }),
        prisma.service.count(),
        prisma.service.count({ where: { isActive: true } }),
      ]);

      // Calculate active workers separately to avoid pool issues
      const activeWorkersList = await prisma.booking.findMany({
        where: {
          assignedWorkerId: { not: null },
          status: { in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] },
        },
        select: { assignedWorkerId: true },
        distinct: ['assignedWorkerId'],
      });
      const activeWorkersCount = activeWorkersList.length;

      res.json({
        bookings: {
          total: totalBookings,
          today: bookingsToday,
          thisWeek: bookingsThisWeek,
          completed: completedBookings,
          cancelled: cancelledBookings,
          completionRate: totalBookings > 0 
            ? ((completedBookings / totalBookings) * 100).toFixed(1) 
            : 0,
        },
        revenue: {
          total: totalRevenue._sum.totalAmount || 0,
          averageBookingValue: avgBookingValue._avg.totalAmount || 0,
          completedBookingsCount: avgBookingValue._count.totalAmount || 0,
        },
        workers: {
          total: totalWorkers,
          active: activeWorkersCount,
          inactive: totalWorkers - activeWorkersCount,
        },
        services: {
          total: totalServices,
          active: activeServices,
          inactive: totalServices - activeServices,
        },
      });
    } catch (error) {
      console.error('[Admin Analytics] Error in getOverview:', error);
      next(error);
    }
  },

  // GET /api/admin/analytics/bookings - Get detailed booking analytics
  getBookingsAnalytics: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      // Date calculations
      const now = new Date();
      const startOfToday = new Date(now.setHours(0, 0, 0, 0));
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Status breakdown - use findMany instead of groupBy to avoid pool issues
      const allBookings = await prisma.booking.findMany({
        select: { status: true },
      });
      const statusBreakdownMap = {};
      allBookings.forEach(b => {
        statusBreakdownMap[b.status] = (statusBreakdownMap[b.status] || 0) + 1;
      });
      const statusBreakdown = Object.entries(statusBreakdownMap).map(([status, count]) => ({
        status,
        _count: { id: count },
      }));

      // Bookings by date range
      const [todayBookings, weekBookings, monthBookings] = await Promise.all([
        prisma.booking.count({
          where: { createdAt: { gte: startOfToday } },
        }),
        prisma.booking.count({
          where: { createdAt: { gte: startOfWeek } },
        }),
        prisma.booking.count({
          where: { createdAt: { gte: startOfMonth } },
        }),
      ]);

      // Bookings trend (last 7 days)
      // TODO: Future enhancement - make date range configurable
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      
      const recentBookings = await prisma.booking.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
        },
        select: {
          createdAt: true,
          status: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      // Group by day
      const bookingsByDay = {};
      recentBookings.forEach(booking => {
        const day = booking.createdAt.toISOString().split('T')[0];
        if (!bookingsByDay[day]) {
          bookingsByDay[day] = { date: day, count: 0 };
        }
        bookingsByDay[day].count++;
      });

      res.json({
        summary: {
          today: todayBookings,
          thisWeek: weekBookings,
          thisMonth: monthBookings,
        },
        statusBreakdown: statusBreakdown.map(item => ({
          status: item.status,
          count: item._count.id,
        })),
        trend: {
          period: '7days',
          data: Object.values(bookingsByDay),
        },
      });
    } catch (error) {
      console.error('[Admin Analytics] Error in getBookingsAnalytics:', error);
      next(error);
    }
  },

  // GET /api/admin/analytics/revenue - Get revenue analytics
  getRevenueAnalytics: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      // Date calculations
      const now = new Date();
      const startOfToday = new Date(now.setHours(0, 0, 0, 0));
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Revenue aggregations - reduce parallel queries
      const [totalRevenue, todayRevenue] = await Promise.all([
        prisma.booking.aggregate({
          where: { status: 'COMPLETED', totalAmount: { not: null } },
          _sum: { totalAmount: true },
          _count: { totalAmount: true },
        }),
        prisma.booking.aggregate({
          where: { status: 'COMPLETED', totalAmount: { not: null }, createdAt: { gte: startOfToday } },
          _sum: { totalAmount: true },
          _count: { totalAmount: true },
        }),
      ]);

      const [weekRevenue, monthRevenue, avgBookingValue] = await Promise.all([
        prisma.booking.aggregate({
          where: { status: 'COMPLETED', totalAmount: { not: null }, createdAt: { gte: startOfWeek } },
          _sum: { totalAmount: true },
          _count: { totalAmount: true },
        }),
        prisma.booking.aggregate({
          where: { status: 'COMPLETED', totalAmount: { not: null }, createdAt: { gte: startOfMonth } },
          _sum: { totalAmount: true },
          _count: { totalAmount: true },
        }),
        prisma.booking.aggregate({
          where: { status: 'COMPLETED', totalAmount: { not: null } },
          _avg: { totalAmount: true },
        }),
      ]);

      // Get revenue by service (simplified query)
      const completedBookings = await prisma.booking.findMany({
        where: {
          status: 'COMPLETED',
          totalAmount: { not: null },
        },
        select: {
          serviceId: true,
          serviceName: true,
          totalAmount: true,
        },
        take: 1000, // Limit to avoid pool exhaustion
      });

      // Group by service
      const serviceRevenueMap = {};
      completedBookings.forEach(booking => {
        const key = booking.serviceId || booking.serviceName || 'Unknown';
        if (!serviceRevenueMap[key]) {
          serviceRevenueMap[key] = {
            serviceId: booking.serviceId,
            serviceName: booking.serviceName || 'Unknown Service',
            revenue: 0,
            bookingCount: 0,
          };
        }
        serviceRevenueMap[key].revenue += booking.totalAmount || 0;
        serviceRevenueMap[key].bookingCount += 1;
      });

      const serviceRevenue = Object.values(serviceRevenueMap).sort((a, b) => b.revenue - a.revenue);

      res.json({
        summary: {
          total: totalRevenue._sum.totalAmount || 0,
          today: todayRevenue._sum.totalAmount || 0,
          thisWeek: weekRevenue._sum.totalAmount || 0,
          thisMonth: monthRevenue._sum.totalAmount || 0,
          averageBookingValue: avgBookingValue._avg.totalAmount || 0,
        },
        counts: {
          totalCompleted: totalRevenue._count.totalAmount || 0,
          todayCompleted: todayRevenue._count.totalAmount || 0,
          weekCompleted: weekRevenue._count.totalAmount || 0,
          monthCompleted: monthRevenue._count.totalAmount || 0,
        },
        byService: serviceRevenue,
      });
    } catch (error) {
      console.error('[Admin Analytics] Error in getRevenueAnalytics:', error);
      next(error);
    }
  },

  // GET /api/admin/analytics/workers - Get worker performance analytics
  getWorkersAnalytics: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      // Get all workers
      const workers = await prisma.profile.findMany({
        where: { role: 'WORKER' },
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      });

      // Get worker performance metrics - process in smaller batches
      const workerStats = [];
      for (const worker of workers) {
        const [
          totalBookings,
          completedBookings,
          inProgressBookings,
          assignedBookings,
        ] = await Promise.all([
          prisma.booking.count({ where: { assignedWorkerId: worker.id } }),
          prisma.booking.count({ where: { assignedWorkerId: worker.id, status: 'COMPLETED' } }),
          prisma.booking.count({ where: { assignedWorkerId: worker.id, status: 'IN_PROGRESS' } }),
          prisma.booking.count({ where: { assignedWorkerId: worker.id, status: 'ASSIGNED' } }),
        ]);

        const revenue = await prisma.booking.aggregate({
          where: {
            assignedWorkerId: worker.id,
            status: 'COMPLETED',
            totalAmount: { not: null },
          },
          _sum: { totalAmount: true },
        });

          const completionRate = totalBookings > 0
            ? ((completedBookings / totalBookings) * 100).toFixed(1)
            : 0;

          return {
            workerId: worker.id,
            workerName: worker.fullName || worker.email,
            email: worker.email,
            totalJobs: totalBookings,
            completedJobs: completedBookings,
            inProgressJobs: inProgressBookings,
            assignedJobs: assignedBookings,
            completionRate: parseFloat(completionRate),
            revenue: revenue._sum.totalAmount || 0,
            isActive: totalBookings > 0,
          };
          workerStats.push({
            workerId: worker.id,
            workerName: worker.fullName || worker.email,
            email: worker.email,
            totalJobs: totalBookings,
            completedJobs: completedBookings,
            inProgressJobs: inProgressBookings,
            assignedJobs: assignedBookings,
            completionRate: parseFloat(completionRate),
            revenue: revenue._sum.totalAmount || 0,
            isActive: totalBookings > 0,
          });
        }

        // Sort by total jobs descending
        workerStats.sort((a, b) => b.totalJobs - a.totalJobs);

      // Calculate summary
      const activeWorkers = workerStats.filter(w => w.isActive).length;
      const totalCompleted = workerStats.reduce((sum, w) => sum + w.completedJobs, 0);
      const totalRevenue = workerStats.reduce((sum, w) => sum + w.revenue, 0);
      const avgCompletionRate = workerStats.length > 0
        ? (workerStats.reduce((sum, w) => sum + w.completionRate, 0) / workerStats.length).toFixed(1)
        : 0;

      res.json({
        summary: {
          totalWorkers: workers.length,
          activeWorkers,
          inactiveWorkers: workers.length - activeWorkers,
          totalCompletedJobs: totalCompleted,
          totalRevenue,
          averageCompletionRate: parseFloat(avgCompletionRate),
        },
        workers: workerStats,
      });
    } catch (error) {
      console.error('[Admin Analytics] Error in getWorkersAnalytics:', error);
      next(error);
    }
  },

  // GET /api/admin/analytics/services - Get service performance analytics
  getServicesAnalytics: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      // Get all services
      const services = await prisma.service.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
        },
      });

      // Get booking counts and revenue per service
      const serviceStats = await Promise.all(
        services.map(async (service) => {
          const [
            totalBookings,
            completedBookings,
            revenue,
          ] = await Promise.all([
            // Total bookings
            prisma.booking.count({
              where: { serviceId: service.id },
            }),
            // Completed bookings
            prisma.booking.count({
              where: {
                serviceId: service.id,
                status: 'COMPLETED',
              },
            }),
            // Revenue
            prisma.booking.aggregate({
              where: {
                serviceId: service.id,
                status: 'COMPLETED',
                totalAmount: { not: null },
              },
              _sum: { totalAmount: true },
            }),
          ]);

          return {
            serviceId: service.id,
            serviceName: service.name,
            slug: service.slug,
            isActive: service.isActive,
            totalBookings,
            completedBookings,
            revenue: revenue._sum.totalAmount || 0,
          };
        })
      );

      // Sort by total bookings descending
      serviceStats.sort((a, b) => b.totalBookings - a.totalBookings);

      // Find most and least booked
      const activeServices = serviceStats.filter(s => s.isActive);
      const mostBooked = activeServices.length > 0 ? activeServices[0] : null;
      const leastBooked = activeServices.length > 0 
        ? activeServices[activeServices.length - 1] 
        : null;

      // Calculate totals
      const totalBookings = serviceStats.reduce((sum, s) => sum + s.totalBookings, 0);
      const totalRevenue = serviceStats.reduce((sum, s) => sum + s.revenue, 0);

      res.json({
        summary: {
          totalServices: services.length,
          activeServices: activeServices.length,
          totalBookings,
          totalRevenue,
        },
        mostBooked: mostBooked || null,
        leastBooked: leastBooked || null,
        services: serviceStats,
      });
    } catch (error) {
      console.error('[Admin Analytics] Error in getServicesAnalytics:', error);
      next(error);
    }
  },
};

export default analyticsController;

