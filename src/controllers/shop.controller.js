import prisma from '../lib/prisma.js';

const shopController = {
  // GET /api/shop/products - Get all active products
  getProducts: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const products = await prisma.product.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      res.json(products);
    } catch (error) {
      console.error('[Shop] Error in getProducts:', error);
      next(error);
    }
  },

  // GET /api/shop/products/:id - Get product by ID
  getProductById: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;

      const product = await prisma.product.findUnique({
        where: { id },
      });

      if (!product || !product.isActive) {
        return res.status(404).json({ message: 'Product not found' });
      }

      res.json(product);
    } catch (error) {
      console.error('[Shop] Error in getProductById:', error);
      next(error);
    }
  },

  // POST /api/shop/orders - Create an order
  createOrder: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Order must contain at least one item' });
      }

      // Get user profile
      const profile = await prisma.profile.findUnique({
        where: { userId: req.user.id },
      });

      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      // Validate and fetch products
      const productIds = items.map(item => item.productId);
      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          isActive: true,
        },
      });

      if (products.length !== productIds.length) {
        return res.status(400).json({ message: 'One or more products not found or inactive' });
      }

      // Calculate totals
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        if (!product) {
          return res.status(400).json({ message: `Product ${item.productId} not found` });
        }

        const quantity = parseInt(item.quantity) || 1;
        if (quantity < 1) {
          return res.status(400).json({ message: `Invalid quantity for product ${product.name}` });
        }

        const itemSubtotal = product.price * quantity;
        subtotal += itemSubtotal;

        orderItems.push({
          productId: product.id,
          quantity,
          price: product.price,
          subtotal: itemSubtotal,
        });
      }

      // Calculate tax (13% for Saskatchewan)
      const taxRate = 0.13;
      const taxAmount = subtotal * taxRate;
      const totalAmount = subtotal + taxAmount;

      // Create order with items
      const order = await prisma.order.create({
        data: {
          customerId: profile.id,
          status: 'PENDING',
          subtotal,
          taxAmount,
          totalAmount,
          paymentStatus: 'pending',
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // TODO: Send order confirmation email
      console.log(`[Shop] Order created: ${order.id} - Total: $${totalAmount.toFixed(2)}`);

      res.status(201).json({
        message: 'Order created successfully',
        order,
      });
    } catch (error) {
      console.error('[Shop] Error in createOrder:', error);
      next(error);
    }
  },

  // GET /api/shop/orders/mine - Get user's orders
  getMyOrders: async (req, res, next) => {
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

      const orders = await prisma.order.findMany({
        where: { customerId: profile.id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.json(orders);
    } catch (error) {
      console.error('[Shop] Error in getMyOrders:', error);
      next(error);
    }
  },
};

export default shopController;


