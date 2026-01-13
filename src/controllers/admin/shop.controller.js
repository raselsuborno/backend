import prisma from '../../lib/prisma.js';

/**
 * Admin Shop Controller
 * 
 * Manages shop product and category operations for admins:
 * - CRUD operations for products
 * - CRUD operations for product categories
 */
const shopController = {
  // ========== PRODUCT CATEGORIES ==========
  
  // GET /api/admin/shop/categories - Get all product categories
  getAllCategories: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { isActive } = req.query;
      const where = {};
      
      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      const categories = await prisma.productCategory.findMany({
        where,
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      res.json(categories);
    } catch (error) {
      console.error('[Admin Shop] Error in getAllCategories:', error);
      next(error);
    }
  },

  // POST /api/admin/shop/categories - Create new category
  createCategory: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { name, slug, description, imageUrl, isActive = true } = req.body;

      if (!name || !slug) {
        return res.status(400).json({ 
          message: 'Name and slug are required' 
        });
      }

      // Validate slug format
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(slug)) {
        return res.status(400).json({ 
          message: 'Slug must contain only lowercase letters, numbers, and hyphens' 
        });
      }

      // Check if slug already exists
      const existingCategory = await prisma.productCategory.findUnique({
        where: { slug },
      });

      if (existingCategory) {
        return res.status(409).json({ 
          message: 'Category with this slug already exists' 
        });
      }

      const category = await prisma.productCategory.create({
        data: {
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          description: description?.trim() || null,
          imageUrl: imageUrl?.trim() || null,
          isActive: isActive === true || isActive === 'true',
        },
      });

      res.status(201).json(category);
    } catch (error) {
      console.error('[Admin Shop] Error in createCategory:', error);
      next(error);
    }
  },

  // PATCH /api/admin/shop/categories/:id - Update category
  updateCategory: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;
      const { name, slug, description, imageUrl, isActive } = req.body;

      const category = await prisma.productCategory.findUnique({
        where: { id },
      });

      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      // If slug is being updated, validate it
      if (slug && slug !== category.slug) {
        const slugRegex = /^[a-z0-9-]+$/;
        if (!slugRegex.test(slug)) {
          return res.status(400).json({ 
            message: 'Slug must contain only lowercase letters, numbers, and hyphens' 
          });
        }

        const existingCategory = await prisma.productCategory.findUnique({
          where: { slug },
        });

        if (existingCategory) {
          return res.status(409).json({ 
            message: 'Category with this slug already exists' 
          });
        }
      }

      const updatedCategory = await prisma.productCategory.update({
        where: { id },
        data: {
          ...(name && { name: name.trim() }),
          ...(slug && { slug: slug.trim().toLowerCase() }),
          ...(description !== undefined && { description: description?.trim() || null }),
          ...(imageUrl !== undefined && { imageUrl: imageUrl?.trim() || null }),
          ...(isActive !== undefined && { isActive: isActive === true || isActive === 'true' }),
        },
      });

      res.json(updatedCategory);
    } catch (error) {
      console.error('[Admin Shop] Error in updateCategory:', error);
      next(error);
    }
  },

  // DELETE /api/admin/shop/categories/:id - Delete category
  deleteCategory: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;

      const category = await prisma.productCategory.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      });

      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      // Check if category has products
      if (category._count.products > 0) {
        return res.status(400).json({ 
          message: `Cannot delete category with ${category._count.products} product(s). Please remove or reassign products first.` 
        });
      }

      await prisma.productCategory.delete({
        where: { id },
      });

      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('[Admin Shop] Error in deleteCategory:', error);
      next(error);
    }
  },

  // ========== PRODUCTS ==========

  // GET /api/admin/shop/products - Get all products
  getAllProducts: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { isActive, categoryId } = req.query;
      const where = {};
      
      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      const products = await prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      res.json(products);
    } catch (error) {
      console.error('[Admin Shop] Error in getAllProducts:', error);
      next(error);
    }
  },

  // GET /api/admin/shop/products/:id - Get single product
  getProduct: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;

      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          category: true,
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
      });

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      res.json(product);
    } catch (error) {
      console.error('[Admin Shop] Error in getProduct:', error);
      next(error);
    }
  },

  // POST /api/admin/shop/products - Create new product
  createProduct: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { name, slug, description, price, categoryId, imageUrl, isActive = true } = req.body;

      if (!name || !slug || price === undefined || price === null) {
        return res.status(400).json({ 
          message: 'Name, slug, and price are required' 
        });
      }

      // Validate price
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({ 
          message: 'Price must be a valid positive number' 
        });
      }

      // Validate slug format
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(slug)) {
        return res.status(400).json({ 
          message: 'Slug must contain only lowercase letters, numbers, and hyphens' 
        });
      }

      // Check if slug already exists
      const existingProduct = await prisma.product.findUnique({
        where: { slug },
      });

      if (existingProduct) {
        return res.status(409).json({ 
          message: 'Product with this slug already exists' 
        });
      }

      // Validate category if provided
      if (categoryId) {
        const category = await prisma.productCategory.findUnique({
          where: { id: categoryId },
        });

        if (!category) {
          return res.status(404).json({ message: 'Category not found' });
        }
      }

      const product = await prisma.product.create({
        data: {
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          description: description?.trim() || null,
          price: priceNum,
          categoryId: categoryId || null,
          imageUrl: imageUrl?.trim() || null,
          isActive: isActive === true || isActive === 'true',
        },
        include: {
          category: true,
        },
      });

      res.status(201).json(product);
    } catch (error) {
      console.error('[Admin Shop] Error in createProduct:', error);
      next(error);
    }
  },

  // PATCH /api/admin/shop/products/:id - Update product
  updateProduct: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;
      const { name, slug, description, price, categoryId, imageUrl, isActive } = req.body;

      const product = await prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // If slug is being updated, validate it
      if (slug && slug !== product.slug) {
        const slugRegex = /^[a-z0-9-]+$/;
        if (!slugRegex.test(slug)) {
          return res.status(400).json({ 
            message: 'Slug must contain only lowercase letters, numbers, and hyphens' 
          });
        }

        const existingProduct = await prisma.product.findUnique({
          where: { slug },
        });

        if (existingProduct) {
          return res.status(409).json({ 
            message: 'Product with this slug already exists' 
          });
        }
      }

      // Validate price if being updated
      if (price !== undefined && price !== null) {
        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum < 0) {
          return res.status(400).json({ 
            message: 'Price must be a valid positive number' 
          });
        }
      }

      // Validate category if provided
      if (categoryId !== undefined && categoryId !== null) {
        if (categoryId) {
          const category = await prisma.productCategory.findUnique({
            where: { id: categoryId },
          });

          if (!category) {
            return res.status(404).json({ message: 'Category not found' });
          }
        }
      }

      const updatedProduct = await prisma.product.update({
        where: { id },
        data: {
          ...(name && { name: name.trim() }),
          ...(slug && { slug: slug.trim().toLowerCase() }),
          ...(description !== undefined && { description: description?.trim() || null }),
          ...(price !== undefined && { price: parseFloat(price) }),
          ...(categoryId !== undefined && { categoryId: categoryId || null }),
          ...(imageUrl !== undefined && { imageUrl: imageUrl?.trim() || null }),
          ...(isActive !== undefined && { isActive: isActive === true || isActive === 'true' }),
        },
        include: {
          category: true,
        },
      });

      res.json(updatedProduct);
    } catch (error) {
      console.error('[Admin Shop] Error in updateProduct:', error);
      next(error);
    }
  },

  // DELETE /api/admin/shop/products/:id - Delete/deactivate product
  deleteProduct: async (req, res, next) => {
    try {
      if (!prisma) {
        return res.status(503).json({ message: 'Database not available' });
      }

      const { id } = req.params;
      const { hardDelete } = req.query; // Optional: hard delete if true

      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
      });

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // If product has been ordered, just deactivate instead of deleting
      if (product._count.orderItems > 0 && !hardDelete) {
        const updatedProduct = await prisma.product.update({
          where: { id },
          data: { isActive: false },
        });
        return res.json({ 
          message: 'Product deactivated (has order history)',
          product: updatedProduct,
        });
      }

      // Hard delete if explicitly requested or no orders
      await prisma.product.delete({
        where: { id },
      });

      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('[Admin Shop] Error in deleteProduct:', error);
      next(error);
    }
  },
};

export default shopController;
