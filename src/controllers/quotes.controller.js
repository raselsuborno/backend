import prisma from '../lib/prisma.js';

const quotesController = {
  // POST /api/quotes - Create a corporate quote request
  createQuote: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const {
        name,
        email,
        phone,
        serviceType,
        details,
        companyName,
      } = req.body;

      // Validate required fields
      if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Name is required' });
      }

      if (!email || !email.trim()) {
        return res.status(400).json({ message: 'Email is required' });
      }

      if (!serviceType || !serviceType.trim()) {
        return res.status(400).json({ message: 'Service type is required' });
      }

      const quote = await prisma.quote.create({
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone?.trim() || null,
          serviceType: serviceType.trim(),
          details: details?.trim() || null,
          companyName: companyName?.trim() || null,
          status: 'PENDING',
        },
      });

      // TODO: Send email notification to admin and confirmation to requester
      console.log(`[Quotes] New quote request created: ${quote.id} - ${quote.email}`);

      res.status(201).json({
        message: 'Quote request submitted successfully',
        quote,
      });
    } catch (error) {
      console.error('[Quotes] Error in createQuote:', error);
      next(error);
    }
  },

  // GET /api/quotes/mine - Get quotes for the authenticated user
  getMyQuotes: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      // Get user profile to get email
      const profile = await prisma.profile.findUnique({
        where: { userId: req.user.id },
      });

      if (!profile) {
        return res.json([]);
      }

      const quotes = await prisma.quote.findMany({
        where: {
          email: profile.email.toLowerCase(),
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.json(quotes);
    } catch (error) {
      console.error('[Quotes] Error in getMyQuotes:', error);
      next(error);
    }
  },

  // GET /api/quotes - Get all quotes (admin only)
  getAllQuotes: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const quotes = await prisma.quote.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.json(quotes);
    } catch (error) {
      console.error('[Quotes] Error in getAllQuotes:', error);
      next(error);
    }
  },
};

export default quotesController;

