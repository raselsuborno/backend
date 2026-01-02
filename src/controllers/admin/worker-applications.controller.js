import prisma from '../../lib/prisma.js';

export const getAllApplications = async (req, res, next) => {
  try {
    const applications = await prisma.workerApplication.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        profile: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    res.json(applications);
  } catch (error) {
    console.error('[Admin Worker Applications] Error:', error);
    next(error);
  }
};

export const approveApplication = async (req, res, next) => {
  try {
    const { id } = req.params;

    const application = await prisma.workerApplication.findUnique({
      where: { id },
      include: {
        profile: true,
      },
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'PENDING') {
      return res.status(400).json({ message: `Application is already ${application.status}` });
    }

    // Update application status
    const updated = await prisma.workerApplication.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    // Update profile role to WORKER
    if (application.profileId) {
      await prisma.profile.update({
        where: { id: application.profileId },
        data: { role: 'WORKER' },
      });
    }

    res.json({
      message: 'Application approved. User role updated to WORKER.',
      application: updated,
    });
  } catch (error) {
    console.error('[Admin Worker Applications] Error:', error);
    next(error);
  }
};

export const requestDocuments = async (req, res, next) => {
  try {
    const { id } = req.params;

    const application = await prisma.workerApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Status stays PENDING, but we could add a note
    res.json({
      message: 'Documents required. Application status remains PENDING.',
      application,
    });
  } catch (error) {
    console.error('[Admin Worker Applications] Error:', error);
    next(error);
  }
};

export const rejectApplication = async (req, res, next) => {
  try {
    const { id } = req.params;

    const application = await prisma.workerApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const updated = await prisma.workerApplication.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    res.json({
      message: 'Application rejected',
      application: updated,
    });
  } catch (error) {
    console.error('[Admin Worker Applications] Error:', error);
    next(error);
  }
};
