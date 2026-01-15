import express from 'express';
import { supabaseAdmin } from '../../lib/supabase.js';

const router = express.Router();

/**
 * GET /api/admin/bookings
 * Get all bookings with optional filters and pagination
 * 
 * Query params:
 *   - page: Page number (default: 1)
 *   - pageSize: Items per page (default: 20)
 *   - status: Filter by booking status
 *   - search: Search in service name, address, customer name/email
 * 
 * Returns: { data: { bookings: [...], pagination: {...} } }
 * 
 * Changes:
 * - Uses supabaseAdmin instead of Prisma
 * - Returns consistent { data: {...} } format
 * - Handles empty results gracefully (returns empty array)
 * - Handles errors with 500 status
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const skip = (page - 1) * pageSize;
    const { status, search } = req.query;

    // Build base query
    let query = supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact' });

    // Add status filter if provided
    if (status) {
      const normalizedStatus = status.toUpperCase();
      query = query.eq('status', normalizedStatus);
    }

    // Add search filter if provided (searches in multiple fields)
    if (search) {
      query = query.or(`serviceName.ilike.%${search}%,addressLine.ilike.%${search}%,city.ilike.%${search}%,guestName.ilike.%${search}%,guestEmail.ilike.%${search}%`);
    }

    // Apply pagination and ordering
    query = query
      .order('createdAt', { ascending: false })
      .range(skip, skip + pageSize - 1);

    // Execute query
    const { data, error, count } = await query;

    // Handle Supabase errors
    if (error) {
      console.error('[Admin Bookings] Supabase error:', error);
      return res.status(500).json({
        message: error.message || 'Failed to fetch bookings',
        error: process.env.NODE_ENV === 'development' ? error : undefined,
        data: { bookings: [], pagination: { page, pageSize, total: 0, totalPages: 0 } }
      });
    }

    // Ensure we have an array (Supabase returns null if no results)
    const bookings = data || [];

    // Calculate pagination
    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    // Return consistent format: { data: {...} }
    res.json({
      data: {
        bookings,
        pagination: {
          page,
          pageSize,
          total,
          totalPages
        }
      }
    });
  } catch (err) {
    console.error('[Admin Bookings] Unexpected error:', err);
    res.status(500).json({
      message: err.message || 'Failed to fetch bookings',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      data: { bookings: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }
    });
  }
});

/**
 * GET /api/admin/bookings/:id
 * Get single booking by ID
 * 
 * Returns: { data: {...} } - Single booking object
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[Admin Bookings] Supabase error:', error);
      // Check if it's a "not found" error
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          message: 'Booking not found',
          data: null
        });
      }
      return res.status(500).json({
        message: error.message || 'Failed to fetch booking',
        error: process.env.NODE_ENV === 'development' ? error : undefined,
        data: null
      });
    }

    res.json({ data: data || null });
  } catch (err) {
    console.error('[Admin Bookings] Unexpected error:', err);
    res.status(500).json({
      message: err.message || 'Failed to fetch booking',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      data: null
    });
  }
});

/**
 * PATCH /api/admin/bookings/:id/status
 * Update booking status
 * 
 * Body: { status: string, notes?: string }
 * Returns: { data: { message: string, booking: {...} } }
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        message: 'Status is required',
        data: null
      });
    }

    // Validate status
    const validStatuses = ['PENDING', 'CONFIRMED', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    const normalizedStatus = status.toUpperCase();

    if (!validStatuses.includes(normalizedStatus)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        data: null
      });
    }

    // Build update data
    const updateData = { status: normalizedStatus };
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Admin Bookings] Supabase error:', error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          message: 'Booking not found',
          data: null
        });
      }
      return res.status(500).json({
        message: error.message || 'Failed to update booking status',
        error: process.env.NODE_ENV === 'development' ? error : undefined,
        data: null
      });
    }

    res.json({
      data: {
        message: 'Booking status updated successfully',
        booking: data
      }
    });
  } catch (err) {
    console.error('[Admin Bookings] Unexpected error:', err);
    res.status(500).json({
      message: err.message || 'Failed to update booking status',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      data: null
    });
  }
});

/**
 * PATCH /api/admin/bookings/:id/assign
 * Assign worker to booking
 * 
 * Body: { workerId: string }
 * Returns: { data: { message: string, booking: {...} } }
 */
router.patch('/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { workerId } = req.body;

    if (!workerId) {
      return res.status(400).json({
        message: 'workerId is required',
        data: null
      });
    }

    // Verify worker exists and is a worker
    const { data: worker, error: workerError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', workerId)
      .single();

    if (workerError || !worker || worker.role !== 'WORKER') {
      return res.status(404).json({
        message: 'Worker not found',
        data: null
      });
    }

    // Update booking
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update({
        assignedWorkerId: workerId,
        status: 'ASSIGNED'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Admin Bookings] Supabase error:', error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          message: 'Booking not found',
          data: null
        });
      }
      return res.status(500).json({
        message: error.message || 'Failed to assign worker',
        error: process.env.NODE_ENV === 'development' ? error : undefined,
        data: null
      });
    }

    res.json({
      data: {
        message: 'Worker assigned successfully',
        booking: data
      }
    });
  } catch (err) {
    console.error('[Admin Bookings] Unexpected error:', err);
    res.status(500).json({
      message: err.message || 'Failed to assign worker',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      data: null
    });
  }
});

/**
 * PATCH /api/admin/bookings/:id/unassign
 * Unassign worker from booking
 * 
 * Returns: { data: { message: string, booking: {...} } }
 */
router.patch('/:id/unassign', async (req, res) => {
  try {
    const { id } = req.params;

    // Get current booking to check status
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      return res.status(404).json({
        message: 'Booking not found',
        data: null
      });
    }

    // Update booking - remove worker assignment
    const updateData = {
      assignedWorkerId: null
    };
    // Revert status if it was ASSIGNED
    if (booking.status === 'ASSIGNED') {
      updateData.status = 'CONFIRMED';
    }

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Admin Bookings] Supabase error:', error);
      return res.status(500).json({
        message: error.message || 'Failed to unassign worker',
        error: process.env.NODE_ENV === 'development' ? error : undefined,
        data: null
      });
    }

    res.json({
      data: {
        message: 'Worker unassigned successfully',
        booking: data
      }
    });
  } catch (err) {
    console.error('[Admin Bookings] Unexpected error:', err);
    res.status(500).json({
      message: err.message || 'Failed to unassign worker',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      data: null
    });
  }
});

/**
 * PUT /api/admin/bookings/:id
 * Update booking (full edit capability)
 * 
 * Body: { status?, date?, timeSlot?, addressLine?, city?, province?, postal?, notes?, totalAmount?, assignedWorkerId? }
 * Returns: { data: { message: string, booking: {...} } }
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {};

    // Validate and add fields if provided
    if (req.body.status) {
      const validStatuses = ['PENDING', 'CONFIRMED', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(req.body.status.toUpperCase())) {
        return res.status(400).json({
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          data: null
        });
      }
      updateData.status = req.body.status.toUpperCase();
    }

    if (req.body.date) updateData.date = req.body.date;
    if (req.body.timeSlot !== undefined) updateData.timeSlot = req.body.timeSlot || null;
    if (req.body.addressLine) updateData.addressLine = req.body.addressLine;
    if (req.body.city) updateData.city = req.body.city;
    if (req.body.province) updateData.province = req.body.province;
    if (req.body.postal) updateData.postal = req.body.postal;
    if (req.body.notes !== undefined) updateData.notes = req.body.notes || null;
    if (req.body.totalAmount !== undefined) {
      updateData.totalAmount = req.body.totalAmount ? parseFloat(req.body.totalAmount) : null;
    }

    if (req.body.assignedWorkerId !== undefined) {
      if (req.body.assignedWorkerId) {
        // Verify worker exists
        const { data: worker } = await supabaseAdmin
          .from('profiles')
          .select('id, role')
          .eq('id', req.body.assignedWorkerId)
          .single();

        if (!worker || worker.role !== 'WORKER') {
          return res.status(400).json({
            message: 'Invalid worker ID',
            data: null
          });
        }
        updateData.assignedWorkerId = req.body.assignedWorkerId;
        if (!updateData.status) {
          updateData.status = 'ASSIGNED';
        }
      } else {
        updateData.assignedWorkerId = null;
      }
    }

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Admin Bookings] Supabase error:', error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          message: 'Booking not found',
          data: null
        });
      }
      return res.status(500).json({
        message: error.message || 'Failed to update booking',
        error: process.env.NODE_ENV === 'development' ? error : undefined,
        data: null
      });
    }

    res.json({
      data: {
        message: 'Booking updated successfully',
        booking: data
      }
    });
  } catch (err) {
    console.error('[Admin Bookings] Unexpected error:', err);
    res.status(500).json({
      message: err.message || 'Failed to update booking',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      data: null
    });
  }
});

export default router;
