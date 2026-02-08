import prisma from '../../lib/prisma.js';

export const getAllOrders = async (req, res, next) => {
  try {
    if (!prisma) {
      return res.status(200).json({
        orders: [],
        pagination: { page: 1, pageSize: 50, total: 0, totalPages: 0 },
        error: 'Database not available',
      });
    }

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const skip = (page - 1) * pageSize;
    const status = req.query.status;

    const where = status ? { status: status.toUpperCase() } : {};

    const [ordersResult, totalResult] = await Promise.allSettled([
      prisma.order.findMany({
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
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    const orders = ordersResult.status === 'fulfilled' ? ordersResult.value : [];
    const total = totalResult.status === 'fulfilled' ? totalResult.value : 0;

    if (ordersResult.status === 'rejected') {
      console.error('[Admin Orders] Error fetching orders:', ordersResult.reason);
    }
    if (totalResult.status === 'rejected') {
      console.error('[Admin Orders] Error counting orders:', totalResult.reason);
    }

    res.json({
      orders,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('[Admin Orders] Error:', error);
    // Return default data instead of throwing
    return res.status(200).json({
      orders: [],
      pagination: { page: 1, pageSize: 50, total: 0, totalPages: 0 },
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status: status.toUpperCase() },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    res.json({ message: 'Order status updated', order });
  } catch (error) {
    console.error('[Admin Orders] Error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Order not found' });
    }
    next(error);
  }
};

export const getOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            street: true,
            city: true,
            province: true,
            postal: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('[Admin Orders] Error:', error);
    next(error);
  }
};



