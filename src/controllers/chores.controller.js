import prisma from '../lib/prisma.js';

const choresController = {
  // GET /api/chores - Get all chores for authenticated user
  getAllChores: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const profile = await prisma.profile.findUnique({
        where: { userId: req.user.id },
      });

      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      const chores = await prisma.chore.findMany({
        where: { customerId: profile.id },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.json(chores);
    } catch (error) {
      console.error('[Chores] Error in getAllChores:', error);
      next(error);
    }
  },

  // GET /api/chores/:id - Get a specific chore
  getChoreById: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;

      const profile = await prisma.profile.findUnique({
        where: { userId: req.user.id },
      });

      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      const chore = await prisma.chore.findUnique({
        where: { id },
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

      if (!chore) {
        return res.status(404).json({ message: 'Chore not found' });
      }

      if (chore.customerId !== profile.id) {
        return res.status(403).json({ message: 'Not authorized to view this chore' });
      }

      res.json(chore);
    } catch (error) {
      console.error('[Chores] Error in getChoreById:', error);
      next(error);
    }
  },

  // POST /api/chores - Create a new chore (supports both logged-in users and guests)
  createChore: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const {
        title,
        category,
        description,
        budget,
        address,
        city,
        province,
        postal,
        // Guest fields (for non-logged in users)
        guestEmail,
        guestName,
        guestPhone,
      } = req.body;

      // Validate required fields
      if (!title || !title.trim()) {
        return res.status(400).json({ message: 'Title is required' });
      }

      let customerId = null;
      let choreEmail = null;
      let choreName = null;
      let chorePhone = null;

      // Handle logged-in users
      if (req.user && req.user.id) {
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

        customerId = profile.id;
        choreEmail = req.user.email;
        choreName = profile.fullName || req.user.user_metadata?.name;
      } else {
        // Handle guest users
        if (!guestEmail || !guestEmail.trim()) {
          return res.status(400).json({ message: 'Email is required for guest users' });
        }
        choreEmail = guestEmail.trim();
        choreName = guestName?.trim() || null;
        chorePhone = guestPhone?.trim() || null;
      }

      const chore = await prisma.chore.create({
        data: {
          title: title.trim(),
          category: category || "Other",
          description: description?.trim() || null,
          budget: budget ? parseFloat(budget) : null,
          address: address?.trim() || null,
          city: city?.trim() || null,
          province: province?.trim() || null,
          postal: postal?.trim() || null,
          customerId: customerId,
          // Guest fields
          guestEmail: choreEmail,
          guestName: choreName,
          guestPhone: chorePhone,
          status: "PENDING",
        },
        include: {
          customer: customerId ? {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          } : false,
        },
      });

      // TODO: Send email confirmation to guest users
      // For guest users (req.user === null), send confirmation email to guestEmail
      // This can be implemented using an email service (SendGrid, AWS SES, etc.)
      if (!req.user && choreEmail) {
        console.log(`[Chores] Guest chore created - Email confirmation needed for: ${choreEmail}`);
        // Example: await sendEmailConfirmation(choreEmail, chore);
      }

      res.status(201).json(chore);
    } catch (error) {
      console.error('[Chores] Error in createChore:', error);
      next(error);
    }
  },

  // PUT /api/chores/:id - Update a chore
  updateChore: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;
      const updateData = req.body;

      const profile = await prisma.profile.findUnique({
        where: { userId: req.user.id },
      });

      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      const existingChore = await prisma.chore.findUnique({
        where: { id },
      });

      if (!existingChore) {
        return res.status(404).json({ message: 'Chore not found' });
      }

      if (existingChore.customerId !== profile.id) {
        return res.status(403).json({ message: 'Not authorized to update this chore' });
      }

      const updatedChore = await prisma.chore.update({
        where: { id },
        data: updateData,
      });

      res.json(updatedChore);
    } catch (error) {
      console.error('[Chores] Error in updateChore:', error);
      next(error);
    }
  },

  // DELETE /api/chores/:id - Delete a chore
  deleteChore: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;

      const profile = await prisma.profile.findUnique({
        where: { userId: req.user.id },
      });

      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      const existingChore = await prisma.chore.findUnique({
        where: { id },
      });

      if (!existingChore) {
        return res.status(404).json({ message: 'Chore not found' });
      }

      if (existingChore.customerId !== profile.id) {
        return res.status(403).json({ message: 'Not authorized to delete this chore' });
      }

      await prisma.chore.delete({
        where: { id },
      });

      res.json({ message: 'Chore deleted successfully' });
    } catch (error) {
      console.error('[Chores] Error in deleteChore:', error);
      next(error);
    }
  },

};

export default choresController;

