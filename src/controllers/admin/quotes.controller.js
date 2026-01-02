import prisma from '../../lib/prisma.js';

export const getAllQuotes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const skip = (page - 1) * pageSize;
    const status = req.query.status;

    const where = status ? { status: status.toUpperCase() } : {};

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.quote.count({ where }),
    ]);

    res.json({
      quotes,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('[Admin Quotes] Error:', error);
    next(error);
  }
};

export const updateQuoteStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const validStatuses = ['PENDING', 'CONTACTED', 'QUOTED', 'ACCEPTED', 'REJECTED'];
    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const quote = await prisma.quote.update({
      where: { id },
      data: { status: status.toUpperCase() },
    });

    res.json({ message: 'Quote status updated', quote });
  } catch (error) {
    console.error('[Admin Quotes] Error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Quote not found' });
    }
    next(error);
  }
};

export const deleteQuote = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.quote.delete({ where: { id } });
    res.json({ message: 'Quote deleted successfully' });
  } catch (error) {
    console.error('[Admin Quotes] Error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Quote not found' });
    }
    next(error);
  }
};


