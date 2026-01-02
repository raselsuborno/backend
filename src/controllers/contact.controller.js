import prisma from '../lib/prisma.js';

const contactController = {
  // POST /api/contact - Submit a contact message
  createMessage: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { name, email, subject, message } = req.body;

      // Validation
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ 
          message: 'All fields are required: name, email, subject, message' 
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email address' });
      }

      // Create contact message
      const contactMessage = await prisma.contactMessage.create({
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          subject: subject.trim(),
          message: message.trim(),
          status: 'NEW',
        },
      });

      res.status(201).json({
        message: 'Your message has been sent successfully. We\'ll get back to you soon!',
        id: contactMessage.id,
      });
    } catch (error) {
      console.error('[Contact] Error in createMessage:', error);
      next(error);
    }
  },

  // GET /api/admin/contact - Get all contact messages (admin only)
  getAllMessages: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { status, page = 1, limit = 50 } = req.query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const where = status ? { status: status.toUpperCase() } : {};

      const [messages, total] = await Promise.all([
        prisma.contactMessage.findMany({
          where,
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limitNum,
        }),
        prisma.contactMessage.count({ where }),
      ]);

      res.json({
        messages,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('[Contact] Error in getAllMessages:', error);
      next(error);
    }
  },

  // GET /api/admin/contact/:id - Get a single contact message (admin only)
  getMessage: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;

      const message = await prisma.contactMessage.findUnique({
        where: { id },
      });

      if (!message) {
        return res.status(404).json({ message: 'Contact message not found' });
      }

      res.json(message);
    } catch (error) {
      console.error('[Contact] Error in getMessage:', error);
      next(error);
    }
  },

  // PUT /api/admin/contact/:id/status - Update message status (admin only)
  updateStatus: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;
      const { status, adminNotes } = req.body;

      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }

      const validStatuses = ['NEW', 'READ', 'REPLIED', 'ARCHIVED'];
      if (!validStatuses.includes(status.toUpperCase())) {
        return res.status(400).json({ 
          message: `Status must be one of: ${validStatuses.join(', ')}` 
        });
      }

      const updateData = {
        status: status.toUpperCase(),
      };

      // If marking as replied, set repliedAt and repliedBy
      if (status.toUpperCase() === 'REPLIED') {
        updateData.repliedAt = new Date();
        updateData.repliedBy = req.user?.id || null;
      }

      // Add admin notes if provided
      if (adminNotes !== undefined) {
        updateData.adminNotes = adminNotes;
      }

      const message = await prisma.contactMessage.update({
        where: { id },
        data: updateData,
      });

      res.json(message);
    } catch (error) {
      console.error('[Contact] Error in updateStatus:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Contact message not found' });
      }
      next(error);
    }
  },

  // DELETE /api/admin/contact/:id - Delete a contact message (admin only)
  deleteMessage: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;

      await prisma.contactMessage.delete({
        where: { id },
      });

      res.json({ message: 'Contact message deleted successfully' });
    } catch (error) {
      console.error('[Contact] Error in deleteMessage:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Contact message not found' });
      }
      next(error);
    }
  },
};

export default contactController;


