import prisma from '../../lib/prisma.js';

/**
 * Admin Bookings Controller
 * 
 * Manages booking operations for admins:
 * - View all bookings
 * - Update booking status
 * - Assign/unassign workers
 */
const bookingsController = {
  // GET /api/admin/bookings - Get all bookings with filters and pagination
  getAllBookings: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 20;
      const skip = (page - 1) * pageSize;
      const status = req.query.status;
      const search = req.query.search;

      // Build where clause
      const where = {};
      if (status) {
        where.status = status.toUpperCase();
      }
      if (search) {
        where.OR = [
          { serviceName: { contains: search, mode: 'insensitive' } },
          { addressLine: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
          { guestName: { contains: search, mode: 'insensitive' } },
          { guestEmail: { contains: search, mode: 'insensitive' } },
          { customer: { email: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where,
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
            // Exclude completionPhotoUrl and workerNotes if they don't exist in DB
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
                phone: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: pageSize,
        }).catch((err) => {
          console.error('[Admin Bookings] Error in findMany:', err);
          // If select fails, try without select (fallback)
          return prisma.booking.findMany({
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
              assignedWorker: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phone: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            skip,
            take: pageSize,
          });
        }),
        prisma.booking.count({ where }).catch(() => 0),
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
      console.error('[Admin Bookings] Error in getAllBookings:', error);
      console.error('[Admin Bookings] Error stack:', error.stack);
      console.error('[Admin Bookings] Error message:', error.message);
      
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

  // GET /api/admin/bookings/:id - Get single booking details
  getBooking: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              city: true,
              province: true,
            },
          },
          service: true,
          assignedWorker: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      res.json(booking);
    } catch (error) {
      console.error('[Admin Bookings] Error in getBooking:', error);
      next(error);
    }
  },

  // PATCH /api/admin/bookings/:id/status - Update booking status
  updateStatus: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;
      const { status, notes } = req.body;

      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }

      // Validate status
      const validStatuses = ['PENDING', 'CONFIRMED', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
      const normalizedStatus = status.toUpperCase();
      
      if (!validStatuses.includes(normalizedStatus)) {
        return res.status(400).json({ 
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        });
      }

      // Update booking
      const updateData = { status: normalizedStatus };
      if (notes !== undefined) {
        updateData.notes = notes;
      }

      const booking = await prisma.booking.update({
        where: { id },
        data: updateData,
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          assignedWorker: {
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
              slug: true,
            },
          },
        },
      });

      res.json({
        message: 'Booking status updated successfully',
        booking,
      });
    } catch (error) {
      console.error('[Admin Bookings] Error in updateStatus:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Booking not found' });
      }
      next(error);
    }
  },

  // PUT /api/admin/bookings/:id - Update booking (full edit capability)
  updateBooking: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;
      const {
        status,
        date,
        timeSlot,
        addressLine,
        city,
        province,
        postal,
        notes,
        totalAmount,
        assignedWorkerId,
      } = req.body;

      const updateData = {};

      if (status) {
        const validStatuses = ['PENDING', 'CONFIRMED', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
        if (!validStatuses.includes(status.toUpperCase())) {
          return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }
        updateData.status = status.toUpperCase();
      }

      if (date) updateData.date = new Date(date);
      if (timeSlot !== undefined) updateData.timeSlot = timeSlot || null;
      if (addressLine) updateData.addressLine = addressLine;
      if (city) updateData.city = city;
      if (province) updateData.province = province;
      if (postal) updateData.postal = postal;
      if (notes !== undefined) updateData.notes = notes || null;
      if (totalAmount !== undefined) updateData.totalAmount = totalAmount ? parseFloat(totalAmount) : null;
      if (assignedWorkerId !== undefined) {
        if (assignedWorkerId) {
          // Verify worker exists
          const worker = await prisma.profile.findUnique({
            where: { id: assignedWorkerId },
          });
          if (!worker || worker.role !== 'WORKER') {
            return res.status(400).json({ message: 'Invalid worker ID' });
          }
          updateData.assignedWorkerId = assignedWorkerId;
          if (!updateData.status) {
            updateData.status = 'ASSIGNED';
          }
        } else {
          updateData.assignedWorkerId = null;
        }
      }

      const booking = await prisma.booking.update({
        where: { id },
        data: updateData,
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          assignedWorker: {
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
              slug: true,
            },
          },
        },
      });

      res.json({
        message: 'Booking updated successfully',
        booking,
      });
    } catch (error) {
      console.error('[Admin Bookings] Error in updateBooking:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Booking not found' });
      }
      next(error);
    }
  },

  // PATCH /api/admin/bookings/:id/assign - Assign worker to booking
  assignWorker: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;
      const { workerId, teamId } = req.body;

      // Validate: cannot assign both worker and team
      if (workerId && teamId) {
        return res.status(400).json({ 
          message: 'Cannot assign both worker and team. Please assign either a worker OR a team.' 
        });
      }

      if (!workerId && !teamId) {
        return res.status(400).json({ 
          message: 'Either workerId or teamId is required' 
        });
      }

      // Get booking
      const booking = await prisma.booking.findUnique({
        where: { id },
      });

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      let updateData = {};

      if (workerId) {
        // Verify worker exists and is a worker
        const worker = await prisma.profile.findUnique({
          where: { id: workerId },
        });

        if (!worker || worker.role !== 'WORKER') {
          return res.status(404).json({ message: 'Worker not found' });
        }

        updateData.assignedWorkerId = workerId;
        updateData.status = 'ASSIGNED';
      }

      // TODO: Implement team assignment when Team model is added
      // if (teamId) {
      //   const team = await prisma.team.findUnique({
      //     where: { id: teamId },
      //   });
      //   if (!team) {
      //     return res.status(404).json({ message: 'Team not found' });
      //   }
      //   updateData.teamId = teamId;
      //   updateData.assignedWorkerId = null;
      // }

      // Update booking
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: updateData,
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
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
      });

      res.json({
        message: 'Worker assigned successfully',
        booking: updatedBooking,
      });
    } catch (error) {
      console.error('[Admin Bookings] Error in assignWorker:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Booking not found' });
      }
      next(error);
    }
  },

  // PATCH /api/admin/bookings/:id/unassign - Unassign worker from booking
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
          // Revert status if it was ASSIGNED
          status: booking.status === 'ASSIGNED' ? 'CONFIRMED' : booking.status,
        },
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      res.json({
        message: 'Worker unassigned successfully',
        booking: updatedBooking,
      });
    } catch (error) {
      console.error('[Admin Bookings] Error in unassignWorker:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Booking not found' });
      }
      next(error);
    }
  },
};

export default bookingsController;

