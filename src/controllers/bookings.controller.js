import prisma from '../lib/prisma.js';

// Use Prisma enum directly - will be available after prisma generate
// If enum not available, use string literals as fallback
const BookingStatusEnum = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  ASSIGNED: 'ASSIGNED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

const bookingsController = {
  // GET /api/bookings/mine - Get user's bookings
  getMine: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      // Get user profile first
      const profile = await prisma.profile.findUnique({
        where: { userId: req.user.id },
      });

      if (!profile) {
        return res.json([]);
      }

      const bookings = await prisma.booking.findMany({
        where: { customerId: profile.id },
        include: {
          service: true,
          customer: {
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
      });

      res.json(bookings);
    } catch (error) {
      console.error('[Bookings] Error in getMine:', error);
      next(error);
    }
  },

  // GET /api/bookings/:id - Get booking by ID
  getBookingById: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;
      
      // Get user profile
      const profile = await prisma.profile.findUnique({
        where: { userId: req.user.id },
      });

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          service: true,
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Check if booking belongs to user
      if (profile && booking.customerId !== profile.id) {
        return res.status(403).json({ message: 'Not authorized to view this booking' });
      }

      res.json(booking);
    } catch (error) {
      console.error('[Bookings] Error in getBookingById:', error);
      next(error);
    }
  },

  // POST /api/bookings - Create booking
  createBooking: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const {
        serviceSlug,
        serviceName,
        subService,
        frequency,
        date,
        timeSlot,
        addressLine,
        city,
        province,
        postal,
        country,
        notes,
        totalAmount,
      } = req.body;

      // Get or create user profile
      let profile = await prisma.profile.findUnique({
        where: { userId: req.user.id },
      });

      if (!profile) {
        profile = await prisma.profile.create({
          data: {
            userId: req.user.id,
            email: req.user.email || '',
            role: 'CUSTOMER',
            fullName: req.user.user_metadata?.name || null,
          },
        });
      }

      // Find service by slug if provided
      let service = null;
      if (serviceSlug) {
        service = await prisma.service.findUnique({
          where: { slug: serviceSlug },
        });
      }

      // Create booking
      const booking = await prisma.booking.create({
        data: {
          customerId: profile.id,
          serviceId: service?.id || null,
          serviceName: serviceName || service?.name || 'Service',
          serviceSlug: serviceSlug || service?.slug || null,
          subService: subService || null,
          frequency: frequency || null,
          date: new Date(date),
          timeSlot: timeSlot || null,
          addressLine: addressLine,
          city: city,
          province: province || 'SK',
          postal: postal,
          country: country || 'Canada',
          notes: notes || null,
          totalAmount: totalAmount || null,
          paymentMethod: req.body.paymentMethod || 'pay_later',
          paymentStatus: req.body.paymentStatus || 'pending',
          status: BookingStatusEnum.PENDING,
        },
        include: {
          service: true,
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      res.status(201).json(booking);
    } catch (error) {
      console.error('[Bookings] Error in createBooking:', error);
      next(error);
    }
  },

  // POST /api/bookings/guest - Create guest booking
  createGuestBooking: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const {
        serviceSlug,
        serviceName,
        subService,
        frequency,
        date,
        timeSlot,
        addressLine,
        city,
        province,
        postal,
        country,
        notes,
        guestName,
        guestEmail,
        guestPhone,
      } = req.body;

      // Find service by slug if provided
      let service = null;
      if (serviceSlug) {
        service = await prisma.service.findUnique({
          where: { slug: serviceSlug },
        });
      }

      // Validate required guest fields
      if (!guestEmail || !guestEmail.trim()) {
        return res.status(400).json({ message: 'Guest email is required' });
      }

      // For guest bookings, we can store guest info directly in booking
      // Optionally create a profile if guest email exists in system
      let profile = null;
      try {
        profile = await prisma.profile.findUnique({
          where: { email: guestEmail.trim().toLowerCase() },
        });
      } catch (err) {
        // Email might not be unique if guest, continue without profile
      }

      const booking = await prisma.booking.create({
        data: {
          customerId: profile?.id || null, // Optional for guest bookings
          guestEmail: guestEmail.trim().toLowerCase(),
          guestName: guestName?.trim() || null,
          guestPhone: guestPhone?.trim() || null,
          serviceId: service?.id || null,
          serviceName: serviceName || service?.name || 'Service',
          serviceSlug: serviceSlug || service?.slug || null,
          subService: subService || null,
          frequency: frequency || null,
          date: new Date(date),
          timeSlot: timeSlot || null,
          addressLine: addressLine,
          city: city,
          province: province || 'SK',
          postal: postal,
          country: country || 'Canada',
          notes: notes || null,
          paymentMethod: req.body.paymentMethod || 'pay_later',
          paymentStatus: req.body.paymentStatus || 'pending',
          status: BookingStatusEnum.PENDING,
        },
        include: {
          service: true,
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      res.status(201).json(booking);
    } catch (error) {
      console.error('[Bookings] Error in createGuestBooking:', error);
      next(error);
    }
  },

  // PUT /api/bookings/:id - Update booking (for rebook)
  updateBooking: async (req, res, next) => {
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

      // Check if booking exists and belongs to user
      const existingBooking = await prisma.booking.findUnique({
        where: { id },
      });

      if (!existingBooking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      if (existingBooking.customerId !== profile.id) {
        return res.status(403).json({ message: 'Not authorized to update this booking' });
      }

      // Convert status to uppercase enum if provided
      if (updateData.status) {
        const statusUpper = updateData.status.toUpperCase();
        const validStatuses = Object.values(BookingStatusEnum);
        if (!validStatuses.includes(statusUpper)) {
          return res.status(400).json({
            message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          });
        }
        updateData.status = statusUpper;
      }

      // Convert date to Date object if provided
      if (updateData.date) {
        updateData.date = new Date(updateData.date);
      }

      const booking = await prisma.booking.update({
        where: { id },
        data: updateData,
        include: {
          service: true,
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      res.json(booking);
    } catch (error) {
      console.error('[Bookings] Error in updateBooking:', error);
      next(error);
    }
  },

  // DELETE /api/bookings/:id - Cancel booking
  cancelBooking: async (req, res, next) => {
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

      // Check if booking exists and belongs to user
      const existingBooking = await prisma.booking.findUnique({
        where: { id },
      });

      if (!existingBooking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      if (existingBooking.customerId !== profile.id) {
        return res.status(403).json({ message: 'Not authorized to cancel this booking' });
      }

      // Update status to CANCELLED instead of deleting
      const booking = await prisma.booking.update({
        where: { id },
        data: { status: BookingStatusEnum.CANCELLED },
        include: {
          service: true,
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      res.json({ message: 'Booking cancelled successfully', booking });
    } catch (error) {
      console.error('[Bookings] Error in cancelBooking:', error);
      next(error);
    }
  },

  // POST /api/bookings/:id/rebook - Rebook a cancelled booking
  rebookBooking: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;
      const { date, timeSlot } = req.body; // New date/time for rebooking

      // Get user profile
      const profile = await prisma.profile.findUnique({
        where: { userId: req.user.id },
      });

      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      // Check if booking exists and belongs to user
      const existingBooking = await prisma.booking.findUnique({
        where: { id },
      });

      if (!existingBooking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      if (existingBooking.customerId !== profile.id) {
        return res.status(403).json({ message: 'Not authorized to rebook this booking' });
      }

      // Create new booking with same details but new date/time
      const newBooking = await prisma.booking.create({
        data: {
          customerId: existingBooking.customerId,
          serviceId: existingBooking.serviceId,
          serviceName: existingBooking.serviceName,
          subService: existingBooking.subService,
          frequency: existingBooking.frequency,
          date: date ? new Date(date) : existingBooking.date,
          timeSlot: timeSlot || existingBooking.timeSlot,
          addressLine: existingBooking.addressLine,
          city: existingBooking.city,
          province: existingBooking.province,
          postal: existingBooking.postal,
          country: existingBooking.country,
          notes: existingBooking.notes,
          totalAmount: existingBooking.totalAmount,
          status: BookingStatusEnum.PENDING,
        },
        include: {
          service: true,
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      res.status(201).json({
        message: 'Booking rebooked successfully',
        booking: newBooking,
      });
    } catch (error) {
      console.error('[Bookings] Error in rebookBooking:', error);
      next(error);
    }
  },

  // POST /api/bookings/:id/reschedule - Reschedule a booking
  rescheduleBooking: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;
      const { date, timeSlot } = req.body;

      if (!date) {
        return res.status(400).json({ message: 'Date is required for rescheduling' });
      }

      // Get user profile
      const profile = await prisma.profile.findUnique({
        where: { userId: req.user.id },
      });

      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      // Check if booking exists and belongs to user
      const existingBooking = await prisma.booking.findUnique({
        where: { id },
      });

      if (!existingBooking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      if (existingBooking.customerId !== profile.id) {
        return res.status(403).json({ message: 'Not authorized to reschedule this booking' });
      }

      // Check if booking can be rescheduled (not completed or cancelled)
      if (existingBooking.status === 'COMPLETED') {
        return res.status(400).json({ message: 'Cannot reschedule a completed booking' });
      }

      if (existingBooking.status === 'CANCELLED') {
        return res.status(400).json({ message: 'Cannot reschedule a cancelled booking. Use rebook instead.' });
      }

      // Update booking with new date/time
      const booking = await prisma.booking.update({
        where: { id },
        data: {
          date: new Date(date),
          timeSlot: timeSlot || existingBooking.timeSlot,
          status: 'PENDING', // Reset to pending when rescheduled
        },
        include: {
          service: true,
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
        message: 'Booking rescheduled successfully',
        booking,
      });
    } catch (error) {
      console.error('[Bookings] Error in rescheduleBooking:', error);
      next(error);
    }
  },

  // POST /api/bookings/:id/favorite - Toggle favorite status
  toggleFavorite: async (req, res, next) => {
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

      // Check if booking exists and belongs to user
      const existingBooking = await prisma.booking.findUnique({
        where: { id },
      });

      if (!existingBooking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      if (existingBooking.customerId !== profile.id) {
        return res.status(403).json({ message: 'Not authorized to modify this booking' });
      }

      // Toggle favorite status
      const booking = await prisma.booking.update({
        where: { id },
        data: {
          isFavorite: !existingBooking.isFavorite,
        },
        include: {
          service: true,
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
        message: booking.isFavorite ? 'Booking added to favorites' : 'Booking removed from favorites',
        booking,
      });
    } catch (error) {
      console.error('[Bookings] Error in toggleFavorite:', error);
      next(error);
    }
  },
};

// Add aliases for customer/bookings.routes.js compatibility
bookingsController.getAllBookings = bookingsController.getMine;
bookingsController.deleteBooking = bookingsController.cancelBooking;

export default bookingsController;
