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
        return res.status(200).json({
          bookings: { total: 0, today: 0, thisWeek: 0, completed: 0, cancelled: 0, completionRate: 0 },
          revenue: { total: 0, averageBookingValue: 0, completedBookingsCount: 0 },
          workers: { total: 0, active: 0, inactive: 0 },
          services: { total: 0, active: 0, inactive: 0 },
          error: 'Database not available',
        });
      }

      // Date calculations
      const now = new Date();
      const startOfToday = new Date(now.setHours(0, 0, 0, 0));
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)

      // Reduce parallel queries to avoid pool exhaustion - execute in batches with error handling
      const batch1Results = await Promise.allSettled([
        prisma.booking.count(),
        prisma.booking.count({ where: { createdAt: { gte: startOfToday } } }),
        prisma.booking.count({ where: { createdAt: { gte: startOfWeek } } }),
        prisma.booking.count({ where: { status: 'COMPLETED' } }),
        prisma.booking.count({ where: { status: 'CANCELLED' } }),
      ]);

      const totalBookings = batch1Results[0].status === 'fulfilled' ? batch1Results[0].value : 0;
      const bookingsToday = batch1Results[1].status === 'fulfilled' ? batch1Results[1].value : 0;
      const bookingsThisWeek = batch1Results[2].status === 'fulfilled' ? batch1Results[2].value : 0;
      const completedBookings = batch1Results[3].status === 'fulfilled' ? batch1Results[3].value : 0;
      const cancelledBookings = batch1Results[4].status === 'fulfilled' ? batch1Results[4].value : 0;

      // Log any failures
      batch1Results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`[Admin Analytics] Batch 1 query ${index} failed:`, result.reason);
        }
      });

      // Batch 2: Revenue and workers
      const batch2Results = await Promise.allSettled([
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

      const totalRevenue = batch2Results[0].status === 'fulfilled' ? batch2Results[0].value : { _sum: { totalAmount: 0 } };
      const avgBookingValue = batch2Results[1].status === 'fulfilled' ? batch2Results[1].value : { _avg: { totalAmount: 0 }, _count: { totalAmount: 0 } };
      const totalWorkers = batch2Results[2].status === 'fulfilled' ? batch2Results[2].value : 0;
      const totalServices = batch2Results[3].status === 'fulfilled' ? batch2Results[3].value : 0;
      const activeServices = batch2Results[4].status === 'fulfilled' ? batch2Results[4].value : 0;

      // Log any failures
      batch2Results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`[Admin Analytics] Batch 2 query ${index} failed:`, result.reason);
        }
      });

      // Calculate active workers separately to avoid pool issues
      let activeWorkersCount = 0;
      try {
        const activeWorkersList = await prisma.booking.findMany({
          where: {
            assignedWorkerId: { not: null },
            status: { in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] },
          },
          select: { assignedWorkerId: true },
          distinct: ['assignedWorkerId'],
        });
        activeWorkersCount = activeWorkersList.length;
      } catch (err) {
        console.error('[Admin Analytics] Error fetching active workers:', err);
      }

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
          total: totalRevenue._sum?.totalAmount || 0,
          averageBookingValue: avgBookingValue._avg?.totalAmount || 0,
          completedBookingsCount: avgBookingValue._count?.totalAmount || 0,
        },
        workers: {
          total: totalWorkers,
          active: activeWorkersCount,
          inactive: Math.max(0, totalWorkers - activeWorkersCount),
        },
        services: {
          total: totalServices,
          active: activeServices,
          inactive: Math.max(0, totalServices - activeServices),
        },
      });
    } catch (error) {
      console.error('[Admin Analytics] Error in getOverview:', error);
      // Return default structure instead of throwing
      return res.status(200).json({
        bookings: { total: 0, today: 0, thisWeek: 0, completed: 0, cancelled: 0, completionRate: 0 },
        revenue: { total: 0, averageBookingValue: 0, completedBookingsCount: 0 },
        workers: { total: 0, active: 0, inactive: 0 },
        services: { total: 0, active: 0, inactive: 0 },
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  },

  // GET /api/admin/analytics/bookings - Get detailed booking analytics
  getBookingsAnalytics: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(200).json({
          statusBreakdown: [],
          dateRange: { today: 0, week: 0, month: 0 },
          trend: [],
          error: 'Database not available',
        });
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
      
      let recentBookings = [];
      try {
        recentBookings = await prisma.booking.findMany({
          where: {
            createdAt: { gte: sevenDaysAgo },
          },
          select: {
            createdAt: true,
            status: true,
          },
          orderBy: { createdAt: 'asc' },
        });
      } catch (err) {
        console.error('[Admin Analytics] Error fetching recent bookings:', err);
      }

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
      // Return default structure instead of throwing
      return res.status(200).json({
        summary: { today: 0, thisWeek: 0, thisMonth: 0 },
        statusBreakdown: [],
        trend: { period: '7days', data: [] },
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
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
        return res.status(200).json({
          summary: { totalWorkers: 0, activeWorkers: 0, inactiveWorkers: 0, totalCompletedJobs: 0, totalRevenue: 0, averageCompletionRate: 0 },
          workers: [],
          error: 'Database not available',
        });
      }

      // Get all workers
      let workers = [];
      try {
        workers = await prisma.profile.findMany({
          where: { role: 'WORKER' },
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        });
      } catch (err) {
        console.error('[Admin Analytics] Error fetching workers:', err);
      }

      // Get worker performance metrics - process in smaller batches with error handling
      const workerStats = [];
      for (const worker of workers) {
        try {
          const statsResults = await Promise.allSettled([
            prisma.booking.count({ where: { assignedWorkerId: worker.id } }),
            prisma.booking.count({ where: { assignedWorkerId: worker.id, status: 'COMPLETED' } }),
            prisma.booking.count({ where: { assignedWorkerId: worker.id, status: 'IN_PROGRESS' } }),
            prisma.booking.count({ where: { assignedWorkerId: worker.id, status: 'ASSIGNED' } }),
            prisma.booking.aggregate({
              where: {
                assignedWorkerId: worker.id,
                status: 'COMPLETED',
                totalAmount: { not: null },
              },
              _sum: { totalAmount: true },
            }),
          ]);

          const totalBookings = statsResults[0].status === 'fulfilled' ? statsResults[0].value : 0;
          const completedBookings = statsResults[1].status === 'fulfilled' ? statsResults[1].value : 0;
          const inProgressBookings = statsResults[2].status === 'fulfilled' ? statsResults[2].value : 0;
          const assignedBookings = statsResults[3].status === 'fulfilled' ? statsResults[3].value : 0;
          const revenue = statsResults[4].status === 'fulfilled' ? statsResults[4].value : { _sum: { totalAmount: 0 } };

          const completionRate = totalBookings > 0
            ? ((completedBookings / totalBookings) * 100).toFixed(1)
            : 0;

          workerStats.push({
            workerId: worker.id,
            workerName: worker.fullName || worker.email,
            email: worker.email,
            totalJobs: totalBookings,
            completedJobs: completedBookings,
            inProgressJobs: inProgressBookings,
            assignedJobs: assignedBookings,
            completionRate: parseFloat(completionRate),
            revenue: revenue._sum?.totalAmount || 0,
            isActive: totalBookings > 0,
          });
        } catch (err) {
          console.error(`[Admin Analytics] Error getting stats for worker ${worker.id}:`, err);
          // Add worker with zero stats
          workerStats.push({
            workerId: worker.id,
            workerName: worker.fullName || worker.email,
            email: worker.email,
            totalJobs: 0,
            completedJobs: 0,
            inProgressJobs: 0,
            assignedJobs: 0,
            completionRate: 0,
            revenue: 0,
            isActive: false,
          });
        }
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
      // Return default structure instead of throwing
      return res.status(200).json({
        summary: { totalWorkers: 0, activeWorkers: 0, inactiveWorkers: 0, totalCompletedJobs: 0, totalRevenue: 0, averageCompletionRate: 0 },
        workers: [],
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  },

  // GET /api/admin/analytics/services - Get service performance analytics
  getServicesAnalytics: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(200).json({
          summary: { totalServices: 0, activeServices: 0, totalBookings: 0, totalRevenue: 0 },
          services: [],
          mostBooked: null,
          leastBooked: null,
          error: 'Database not available',
        });
      }

      // Get all services
      let services = [];
      try {
        services = await prisma.service.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
          },
        });
      } catch (err) {
        console.error('[Admin Analytics] Error fetching services:', err);
      }

      // Get booking counts and revenue per service with error handling
      const serviceStatsResults = await Promise.allSettled(
        services.map(async (service) => {
          const statsResults = await Promise.allSettled([
            prisma.booking.count({ where: { serviceId: service.id } }),
            prisma.booking.count({
              where: {
                serviceId: service.id,
                status: 'COMPLETED',
              },
            }),
            prisma.booking.aggregate({
              where: {
                serviceId: service.id,
                status: 'COMPLETED',
                totalAmount: { not: null },
              },
              _sum: { totalAmount: true },
            }),
          ]);

          const totalBookings = statsResults[0].status === 'fulfilled' ? statsResults[0].value : 0;
          const completedBookings = statsResults[1].status === 'fulfilled' ? statsResults[1].value : 0;
          const revenue = statsResults[2].status === 'fulfilled' ? statsResults[2].value : { _sum: { totalAmount: 0 } };

          return {
            serviceId: service.id,
            serviceName: service.name,
            slug: service.slug,
            isActive: service.isActive,
            totalBookings,
            completedBookings,
            revenue: revenue._sum?.totalAmount || 0,
          };
        })
      );

      const serviceStats = serviceStatsResults
        .map((result) => result.status === 'fulfilled' ? result.value : null)
        .filter(Boolean);

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
      // Return default structure instead of throwing
      return res.status(200).json({
        summary: { totalServices: 0, activeServices: 0, totalBookings: 0, totalRevenue: 0 },
        services: [],
        mostBooked: null,
        leastBooked: null,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  },
};

export default analyticsController;

