import prisma from '../../lib/prisma.js';

/**
 * Worker Application Controller
 * 
 * Handles worker application submissions (public - no auth required).
 * Applications are reviewed by admins before approval.
 */
const workerApplicationController = {
  // POST /api/worker-applications - Submit worker application (public)
  createApplication: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const {
        fullName,
        email,
        phone,
        city,
        province,
        workEligible,
        sinTaxId,
        availability,
        experience,
        termsAccepted,
      } = req.body;

      // Validate required fields
      if (!fullName || !email) {
        return res.status(400).json({ message: 'Full name and email are required' });
      }

      if (termsAccepted !== true) {
        return res.status(400).json({ message: 'You must accept the terms and conditions' });
      }

      // Check if user is logged in (optional - will attach profile if exists)
      let profileId = null;
      if (req.user?.id) {
        // Try to get profile for logged-in user
        const profile = await prisma.profile.findUnique({
          where: { userId: req.user.id },
          select: { id: true },
        });
        profileId = profile?.id || null;
      }

      // Check if email already has a pending application
      const existingApplication = await prisma.workerApplication.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          status: 'PENDING',
        },
      });

      if (existingApplication) {
        return res.status(409).json({ 
          message: 'You already have a pending application. Please wait for review.' 
        });
      }

      // Create worker application (remove sinTaxId if not in schema)
      const application = await prisma.workerApplication.create({
        data: {
          profileId: profileId || null,
          fullName: fullName.trim(),
          email: email.toLowerCase().trim(),
          phone: phone?.trim() || null,
          city: city?.trim() || null,
          province: province?.trim() || null,
          workEligible: workEligible === true || workEligible === 'true',
          availability: availability || null,
          experience: experience?.trim() || null,
          termsAccepted: true,
          termsAcceptedAt: new Date(),
          status: 'PENDING',
        },
      });

      res.status(201).json({
        message: 'Application submitted successfully! We will review your application and get back to you soon.',
        application: {
          id: application.id,
          email: application.email,
          status: application.status,
        },
      });
    } catch (error) {
      console.error('[Worker Application] Error in createApplication:', error);
      if (error.code === 'P2002') {
        return res.status(409).json({ message: 'Application already exists for this email' });
      }
      next(error);
    }
  },

  // GET /api/worker-applications/:id - Get application status (public, by email or ID)
  getApplicationStatus: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;
      const { email } = req.query;

      if (!id && !email) {
        return res.status(400).json({ message: 'Application ID or email is required' });
      }

      const where = id ? { id } : { email: email.toLowerCase().trim() };

      const application = await prisma.workerApplication.findFirst({
        where,
        select: {
          id: true,
          email: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      res.json(application);
    } catch (error) {
      console.error('[Worker Application] Error in getApplicationStatus:', error);
      next(error);
    }
  },
};

export default workerApplicationController;

