import express from 'express';
import { supabaseAdmin } from '../../lib/supabase.js';

const router = express.Router();

/**
 * GET /public/services
 * Get all active services, optionally filtered by type query parameter
 * 
 * Query params:
 *   - type: Optional. Filter by service type (RESIDENTIAL or CORPORATE)
 * 
 * Returns: { data: [...] } - Array of services
 * 
 * Changes:
 * - Uses supabaseAdmin instead of Prisma
 * - Returns consistent { data: [...] } format
 * - Handles errors gracefully with 500 status
 * - Filters by type if provided in query params
 */
router.get('/', async (req, res) => {
  try {
    const { type } = req.query; // RESIDENTIAL or CORPORATE

    // Build query - start with base query for active services
    let query = supabaseAdmin
      .from('services')
      .select('*')
      .eq('isActive', true);

    // Add type filter if provided
    if (type) {
      const normalizedType = type.toUpperCase();
      query = query.eq('type', normalizedType);
    }

    // Execute query
    const { data, error } = await query.order('isTrending', { ascending: false })
      .order('name', { ascending: true });

    // Handle Supabase errors
    if (error) {
      console.error('[Public Services] Supabase error:', error);
      return res.status(500).json({
        message: error.message || 'Failed to fetch services',
        error: process.env.NODE_ENV === 'development' ? error : undefined,
        data: []
      });
    }

    // Format services for frontend compatibility
    // Map Supabase columns to frontend-expected format
    const formattedServices = (data || []).map((service) => ({
      id: service.id,
      slug: service.slug,
      title: service.name,
      name: service.name,
      description: service.description || null,
      image: service.imageUrl || null,
      imageUrl: service.imageUrl || null,
      iconName: service.iconName || null,
      isTrending: service.isTrending || false,
      type: service.type || 'RESIDENTIAL',
      basePrice: service.basePrice || null,
      bookingBlocks: service.bookingBlocks || null,
      // Note: Service options would need a separate query if needed
      // For now, return empty array for compatibility
      options: [],
      bullets: []
    }));

    // Return consistent format: { data: [...] }
    res.json({ data: formattedServices });
  } catch (err) {
    console.error('[Public Services] Unexpected error:', err);
    res.status(500).json({
      message: err.message || 'Failed to fetch services',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      data: []
    });
  }
});

/**
 * GET /public/services/:id
 * Get a single service by ID or slug
 * 
 * Returns: { data: {...} } - Single service object
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by ID first, then by slug
    let query = supabaseAdmin
      .from('services')
      .select('*')
      .eq('isActive', true)
      .or(`id.eq.${id},slug.eq.${id}`)
      .limit(1);

    const { data, error } = await query;

    if (error) {
      console.error('[Public Services] Supabase error:', error);
      return res.status(500).json({
        message: error.message || 'Failed to fetch service',
        error: process.env.NODE_ENV === 'development' ? error : undefined,
        data: null
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        message: 'Service not found',
        data: null
      });
    }

    const service = data[0];

    // Format service for frontend
    const formattedService = {
      id: service.id,
      slug: service.slug,
      title: service.name,
      name: service.name,
      description: service.description || null,
      image: service.imageUrl || null,
      imageUrl: service.imageUrl || null,
      iconName: service.iconName || null,
      isTrending: service.isTrending || false,
      type: service.type || 'RESIDENTIAL',
      basePrice: service.basePrice || null,
      bookingBlocks: service.bookingBlocks || null,
      options: [],
      bullets: []
    };

    res.json({ data: formattedService });
  } catch (err) {
    console.error('[Public Services] Unexpected error:', err);
    res.status(500).json({
      message: err.message || 'Failed to fetch service',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      data: null
    });
  }
});

export default router;
