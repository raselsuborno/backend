import prisma from '../../lib/prisma.js';

export const getAllChores = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const skip = (page - 1) * pageSize;
    const status = req.query.status;

    const where = status ? { status: status.toUpperCase() } : {};

    const [chores, total] = await Promise.all([
      prisma.chore.findMany({
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
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.chore.count({ where }),
    ]);

    res.json({
      chores,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('[Admin Chores] Error:', error);
    next(error);
  }
};

export const updateChoreStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const chore = await prisma.chore.update({
      where: { id },
      data: { status: status.toUpperCase() },
    });

    res.json({ message: 'Chore status updated', chore });
  } catch (error) {
    console.error('[Admin Chores] Error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Chore not found' });
    }
    next(error);
  }
};

export const deleteChore = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.chore.delete({ where: { id } });
    res.json({ message: 'Chore deleted successfully' });
  } catch (error) {
    console.error('[Admin Chores] Error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Chore not found' });
    }
    next(error);
  }
};


