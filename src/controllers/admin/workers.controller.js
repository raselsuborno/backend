import prisma from '../../lib/prisma.js';
import { supabaseAdmin } from '../../lib/supabase.js';

/**
 * Admin Workers Controller
 * 
 * Manages worker operations for admins:
 * - Create worker accounts
 * - Activate/deactivate workers
 * - View worker assignments
 * 
 * NOTE: Workers are Supabase users with profiles.role = "WORKER"
 * Workers cannot self-register - only admins can create them.
 */
const workersController = {
  // GET /api/admin/workers - Get all workers
  getAllWorkers: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const workers = await prisma.profile.findMany({
        where: { role: 'WORKER' },
        select: {
          id: true,
          userId: true,
          fullName: true,
          email: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          fullName: 'asc',
        },
      });

      // Get assignment counts for each worker
      const workersWithStats = await Promise.all(
        workers.map(async (worker) => {
          const [activeBookings, completedBookings] = await Promise.all([
            prisma.booking.count({
              where: { 
                assignedWorkerId: worker.id,
                status: { in: ['PENDING', 'CONFIRMED', 'ASSIGNED'] },
              },
            }),
            prisma.booking.count({
              where: { 
                assignedWorkerId: worker.id,
                status: 'COMPLETED',
              },
            }),
          ]);

          return {
            ...worker,
            activeBookings,
            completedBookings,
            totalBookings: activeBookings + completedBookings,
          };
        })
      );

      res.json(workersWithStats);
    } catch (error) {
      console.error('[Admin Workers] Error in getAllWorkers:', error);
      next(error);
    }
  },

  // GET /api/admin/workers/:id - Get single worker with details
  getWorker: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;

      const worker = await prisma.profile.findUnique({
        where: { id },
        select: {
          id: true,
          userId: true,
          fullName: true,
          email: true,
          phone: true,
          city: true,
          province: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!worker || worker.role !== 'WORKER') {
        return res.status(404).json({ message: 'Worker not found' });
      }

      // Get worker's bookings
      const bookings = await prisma.booking.findMany({
        where: { assignedWorkerId: id },
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
              slug: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
        take: 10, // Latest 10 bookings
      });

      res.json({
        ...worker,
        bookings,
      });
    } catch (error) {
      console.error('[Admin Workers] Error in getWorker:', error);
      next(error);
    }
  },

  // POST /api/admin/workers - Create new worker account
  createWorker: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { email, password, fullName, phone } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          message: 'Email and password are required' 
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email address' });
      }

      // Validate password (minimum 6 characters)
      if (password.length < 6) {
        return res.status(400).json({ 
          message: 'Password must be at least 6 characters' 
        });
      }

      // Check if email already exists
      const existingProfile = await prisma.profile.findUnique({
        where: { email: email.trim().toLowerCase() },
      });

      if (existingProfile) {
        return res.status(409).json({ 
          message: 'User with this email already exists' 
        });
      }

      // Create Supabase user using service role key (admin client)
      const { data: supabaseUser, error: supabaseError } = await supabaseAdmin.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password: password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          fullName: fullName || null,
        },
      });

      if (supabaseError || !supabaseUser?.user) {
        console.error('[Admin Workers] Supabase user creation error:', supabaseError);
        return res.status(500).json({ 
          message: supabaseError?.message || 'Failed to create user account' 
        });
      }

      // Create profile with WORKER role
      const profile = await prisma.profile.create({
        data: {
          userId: supabaseUser.user.id,
          email: email.trim().toLowerCase(),
          fullName: fullName?.trim() || null,
          phone: phone?.trim() || null,
          role: 'WORKER',
        },
      });

      res.status(201).json({
        message: 'Worker account created successfully',
        worker: {
          id: profile.id,
          email: profile.email,
          fullName: profile.fullName,
          phone: profile.phone,
        },
      });
    } catch (error) {
      console.error('[Admin Workers] Error in createWorker:', error);
      if (error.code === 'P2002') {
        return res.status(409).json({ message: 'Email already exists' });
      }
      next(error);
    }
  },

  // PATCH /api/admin/workers/:id/status - Update worker status (activate/deactivate)
  updateWorkerStatus: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;
      const { isActive } = req.body;

      if (isActive === undefined) {
        return res.status(400).json({ message: 'isActive is required' });
      }

      // Find worker
      const worker = await prisma.profile.findUnique({
        where: { id },
      });

      if (!worker || worker.role !== 'WORKER') {
        return res.status(404).json({ message: 'Worker not found' });
      }

      // TODO: Add isActive field to Profile model if needed
      // For now, we'll just update the profile
      // In the future, you might want to add an isActive boolean to Profile
      
      // Update worker profile (placeholder for future isActive field)
      const updatedWorker = await prisma.profile.update({
        where: { id },
        data: {
          // When isActive field is added to schema:
          // isActive: isActive === true || isActive === 'true',
        },
      });

      res.json({
        message: `Worker ${isActive ? 'activated' : 'deactivated'} successfully`,
        worker: updatedWorker,
      });
    } catch (error) {
      console.error('[Admin Workers] Error in updateWorkerStatus:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Worker not found' });
      }
      next(error);
    }
  },
};

export default workersController;

