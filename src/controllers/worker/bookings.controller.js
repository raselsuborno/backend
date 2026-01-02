import prisma from '../../lib/prisma.js';

/**
 * Worker Bookings Controller
 * 
 * Handles worker job lifecycle:
 * - View assigned bookings
 * - Accept/reject assigned jobs
 * - Start jobs
 * - Complete jobs
 * 
 * Rules:
 * - Workers can only access their own assigned bookings
 * - Status transitions are validated
 * - Only valid transitions are allowed
 */
const workerBookingsController = {
  // GET /api/worker/bookings - Get all bookings assigned to this worker
  getMyBookings: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const workerId = req.user.profile.id;
      const { status } = req.query;

      // Build where clause
      const where = {
        assignedWorkerId: workerId,
      };

      if (status) {
        where.status = status.toUpperCase();
      }

      const bookings = await prisma.booking.findMany({
        where,
        include: {
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
        },
        orderBy: {
          date: 'asc', // Show upcoming jobs first
        },
      });

      // Separate bookings by status for easier frontend rendering
      const grouped = {
        assigned: bookings.filter(b => b.status === 'ASSIGNED'),
        accepted: bookings.filter(b => b.status === 'ACCEPTED'),
        inProgress: bookings.filter(b => b.status === 'IN_PROGRESS'),
        completed: bookings.filter(b => b.status === 'COMPLETED'),
        cancelled: bookings.filter(b => b.status === 'CANCELLED'),
      };

      res.json({
        bookings,
        grouped,
        stats: {
          total: bookings.length,
          assigned: grouped.assigned.length,
          accepted: grouped.accepted.length,
          inProgress: grouped.inProgress.length,
          completed: grouped.completed.length,
        },
      });
    } catch (error) {
      console.error('[Worker Bookings] Error in getMyBookings:', error);
      next(error);
    }
  },

  // PATCH /api/worker/bookings/:id/accept - Accept an assigned job
  acceptBooking: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;
      const workerId = req.user.profile.id;

      // Get booking and verify it's assigned to this worker
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Verify booking is assigned to this worker
      if (booking.assignedWorkerId !== workerId) {
        return res.status(403).json({ 
          message: 'This booking is not assigned to you' 
        });
      }

      // Verify current status is ASSIGNED
      if (booking.status !== 'ASSIGNED') {
        return res.status(400).json({ 
          message: `Cannot accept booking with status: ${booking.status}. Only ASSIGNED bookings can be accepted.` 
        });
      }

      // Update status to ACCEPTED
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          status: 'ACCEPTED',
        },
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      res.json({
        message: 'Booking accepted successfully',
        booking: updatedBooking,
      });
    } catch (error) {
      console.error('[Worker Bookings] Error in acceptBooking:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Booking not found' });
      }
      next(error);
    }
  },

  // PATCH /api/worker/bookings/:id/reject - Reject an assigned job
  rejectBooking: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;
      const workerId = req.user.profile.id;

      // Get booking and verify it's assigned to this worker
      const booking = await prisma.booking.findUnique({
        where: { id },
      });

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Verify booking is assigned to this worker
      if (booking.assignedWorkerId !== workerId) {
        return res.status(403).json({ 
          message: 'This booking is not assigned to you' 
        });
      }

      // Verify current status is ASSIGNED
      if (booking.status !== 'ASSIGNED') {
        return res.status(400).json({ 
          message: `Cannot reject booking with status: ${booking.status}. Only ASSIGNED bookings can be rejected.` 
        });
      }

      // Unassign worker (set to null) and revert status to ASSIGNED (or CONFIRMED if no worker assigned)
      // Actually, let's keep it as ASSIGNED but remove the worker assignment so admin can reassign
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          assignedWorkerId: null,
          status: 'CONFIRMED', // Revert to CONFIRMED so admin can reassign
        },
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      res.json({
        message: 'Booking rejected. It will be available for reassignment.',
        booking: updatedBooking,
      });
    } catch (error) {
      console.error('[Worker Bookings] Error in rejectBooking:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Booking not found' });
      }
      next(error);
    }
  },

  // PATCH /api/worker/bookings/:id/start - Start a job
  startBooking: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;
      const workerId = req.user.profile.id;

      // Get booking and verify it's assigned to this worker
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Verify booking is assigned to this worker
      if (booking.assignedWorkerId !== workerId) {
        return res.status(403).json({ 
          message: 'This booking is not assigned to you' 
        });
      }

      // Verify current status is ACCEPTED
      if (booking.status !== 'ACCEPTED') {
        return res.status(400).json({ 
          message: `Cannot start booking with status: ${booking.status}. Only ACCEPTED bookings can be started.` 
        });
      }

      // Update status to IN_PROGRESS
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          status: 'IN_PROGRESS',
        },
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      res.json({
        message: 'Job started successfully',
        booking: updatedBooking,
      });
    } catch (error) {
      console.error('[Worker Bookings] Error in startBooking:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Booking not found' });
      }
      next(error);
    }
  },

  // PATCH /api/worker/bookings/:id/complete - Complete a job
  completeBooking: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;
      const workerId = req.user.profile.id;

      // Get booking and verify it's assigned to this worker
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Verify booking is assigned to this worker
      if (booking.assignedWorkerId !== workerId) {
        return res.status(403).json({ 
          message: 'This booking is not assigned to you' 
        });
      }

      // Verify current status is IN_PROGRESS
      if (booking.status !== 'IN_PROGRESS') {
        return res.status(400).json({ 
          message: `Cannot complete booking with status: ${booking.status}. Only IN_PROGRESS bookings can be completed.` 
        });
      }

      // Update status to COMPLETED
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          status: 'COMPLETED',
        },
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      res.json({
        message: 'Job completed successfully',
        booking: updatedBooking,
      });
    } catch (error) {
      console.error('[Worker Bookings] Error in completeBooking:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Booking not found' });
      }
      next(error);
    }
  },
};

export default workerBookingsController;


