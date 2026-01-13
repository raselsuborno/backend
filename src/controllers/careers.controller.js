import prisma from '../lib/prisma.js';

const careersController = {
  // POST /api/careers - Submit a career application
  createApplication: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const {
        name,
        email,
        jobTitle,
        resumeUrl,
        message,
      } = req.body;

      // Validate required fields
      if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Name is required' });
      }

      if (!email || !email.trim()) {
        return res.status(400).json({ message: 'Email is required' });
      }

      if (!jobTitle || !jobTitle.trim()) {
        return res.status(400).json({ message: 'Job title is required' });
      }

      // Check if user is logged in
      let profileId = null;
      if (req.user && req.user.id) {
        const profile = await prisma.profile.findUnique({
          where: { userId: req.user.id },
        });
        if (profile) {
          profileId = profile.id;
        }
      }

      const application = await prisma.careerApplication.create({
        data: {
          profileId,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          jobTitle: jobTitle.trim(),
          resumeUrl: resumeUrl?.trim() || null,
          message: message?.trim() || null,
          status: 'PENDING',
        },
      });

      // TODO: Send email notification to admin and confirmation to applicant
      console.log(`[Careers] New application submitted: ${application.id} - ${application.email} for ${application.jobTitle}`);

      res.status(201).json({
        message: 'Application submitted successfully',
        application,
      });
    } catch (error) {
      console.error('[Careers] Error in createApplication:', error);
      next(error);
    }
  },

  // GET /api/careers - Get all applications (admin only)
  getAllApplications: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const applications = await prisma.careerApplication.findMany({
        include: {
          profile: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.json(applications);
    } catch (error) {
      console.error('[Careers] Error in getAllApplications:', error);
      next(error);
    }
  },
};

export default careersController;



