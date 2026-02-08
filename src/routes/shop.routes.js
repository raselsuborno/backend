import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../lib/supabase.js';

const router = express.Router();

// Public routes
// GET /api/shop - Get all products
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('isActive', true)
      .order('name', { ascending: true });
    if (error) throw error;
    res.json({ data: data || [] });
  } catch (err) {
    console.error('[Shop] Error in GET /:', err.message);
    res.status(500).json({ message: err.message, data: [] });
  }
});

// GET /api/shop/categories - Get all active categories
router.get('/categories', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('product_categories')
      .select('*')
      .eq('isActive', true)
      .order('name', { ascending: true });
    if (error) throw error;
    res.json({ data: data || [] });
  } catch (err) {
    console.error('[Shop] Error in GET /categories:', err.message);
    res.status(500).json({ message: err.message, data: [] });
  }
});

// GET /api/shop/products - Get all active products
router.get('/products', async (req, res) => {
  try {
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('isActive', true)
      .order('name', { ascending: true });
    
    if (productsError) throw productsError;

    // Fetch categories separately and attach to products
    const categoryIds = [...new Set(products.filter(p => p.categoryId).map(p => p.categoryId))];
    let categoriesMap = {};
    
    if (categoryIds.length > 0) {
      const { data: categories, error: categoriesError } = await supabaseAdmin
        .from('product_categories')
        .select('id, name, slug')
        .in('id', categoryIds);
      
      if (!categoriesError && categories) {
        categoriesMap = categories.reduce((acc, cat) => {
          acc[cat.id] = cat;
          return acc;
        }, {});
      }
    }

    // Attach category info to products
    const productsWithCategories = products.map(product => ({
      ...product,
      category: product.categoryId ? categoriesMap[product.categoryId] : null,
    }));

    res.json({ data: productsWithCategories || [] });
  } catch (err) {
    console.error('[Shop] Error in GET /products:', err.message);
    res.status(500).json({ message: err.message, data: [] });
  }
});

// GET /api/shop/products/:id - Get product by ID
router.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('isActive', true)
      .single();
    
    if (productError) {
      if (productError.code === 'PGRST116') {
        return res.status(404).json({ message: 'Product not found', data: null });
      }
      throw productError;
    }

    // Fetch category if product has one
    let category = null;
    if (product.categoryId) {
      const { data: catData } = await supabaseAdmin
        .from('product_categories')
        .select('id, name, slug')
        .eq('id', product.categoryId)
        .single();
      category = catData;
    }

    res.json({ data: { ...product, category } || null });
  } catch (err) {
    console.error('[Shop] Error in GET /products/:id:', err.message);
    res.status(500).json({ message: err.message, data: null });
  }
});

// Protected routes
router.use(requireAuth);

// POST /api/shop/orders - Create an order
router.post('/orders', async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        message: 'Order must contain at least one item',
        data: null 
      });
    }

    // Get user profile from Supabase
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('userId', req.user.id)
      .single();

    if (profileError || !profileData) {
      return res.status(404).json({ 
        message: 'Profile not found',
        data: null 
      });
    }

    // Validate and fetch products
    const productIds = items.map(item => item.productId);
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('*')
      .in('id', productIds)
      .eq('isActive', true);

    if (productsError) throw productsError;
    if (products.length !== productIds.length) {
      return res.status(400).json({ 
        message: 'One or more products not found or inactive',
        data: null 
      });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        return res.status(400).json({ 
          message: `Product ${item.productId} not found`,
          data: null 
        });
      }

      const quantity = parseInt(item.quantity) || 1;
      if (quantity < 1) {
        return res.status(400).json({ 
          message: `Invalid quantity for product ${product.name}`,
          data: null 
        });
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

    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        customerId: profileData.id,
        status: 'PENDING',
        subtotal,
        taxAmount,
        totalAmount,
        paymentStatus: 'pending',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItemsData = orderItems.map(item => ({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItemsData);

    if (itemsError) throw itemsError;

    // Fetch complete order with items
    const { data: fetchedOrderItems, error: itemsFetchError } = await supabaseAdmin
      .from('order_items')
      .select('*, products(*)')
      .eq('orderId', order.id);

    if (itemsFetchError) throw itemsFetchError;

    // Fetch products for order items (if not already included in the select)
    const fetchedProductIds = fetchedOrderItems.map(item => item.productId);
    const { data: orderProducts, error: productsFetchError } = await supabaseAdmin
      .from('products')
      .select('*')
      .in('id', fetchedProductIds);

    if (productsFetchError) throw productsFetchError;

    // Combine order with items and products
    const completeOrder = {
      ...order,
      items: fetchedOrderItems.map(item => ({
        ...item,
        product: orderProducts.find(p => p.id === item.productId),
      })),
    };

    console.log(`[Shop] Order created: ${order.id} - Total: $${totalAmount.toFixed(2)}`);

    res.status(201).json({
      message: 'Order created successfully',
      data: completeOrder,
    });
  } catch (error) {
    console.error('[Shop] Error in POST /orders:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to create order',
      data: null 
    });
  }
});

// GET /api/shop/orders/mine - Get user's orders
router.get('/orders/mine', async (req, res) => {
  try {
    // Get user profile
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('userId', req.user.id)
      .single();

    if (profileError || !profileData) {
      return res.status(404).json({ 
        message: 'Profile not found',
        data: [] 
      });
    }

    // Get orders
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('customerId', profileData.id)
      .order('createdAt', { ascending: false });

    if (ordersError) throw ordersError;

    // Fetch order items and products for each order
    const ordersWithItems = await Promise.all(
      (orders || []).map(async (order) => {
        const { data: items } = await supabaseAdmin
          .from('order_items')
          .select('*')
          .eq('orderId', order.id);

        if (items && items.length > 0) {
          const productIds = items.map(item => item.productId);
          const { data: products } = await supabaseAdmin
            .from('products')
            .select('*')
            .in('id', productIds);

          return {
            ...order,
            items: items.map(item => ({
              ...item,
              product: products?.find(p => p.id === item.productId),
            })),
          };
        }

        return { ...order, items: [] };
      })
    );

    res.json({ data: ordersWithItems || [] });
  } catch (error) {
    console.error('[Shop] Error in GET /orders/mine:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to load orders',
      data: [] 
    });
  }
});

export default router;



