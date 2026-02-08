import express from "express";
import { supabaseAdmin } from "../../lib/supabase.js";
const router = express.Router();

// GET /api/public/services?type=RESIDENTIAL
router.get("/", async (req, res) => {
  const { type } = req.query;
  try {
    // Include service options (subservices) in the query
    let query = supabaseAdmin
      .from("services")
      .select(`
        *,
        service_options(
          id,
          name,
          description,
          price,
          priceModifier,
          duration,
          isActive
        )
      `);
    if (type) query = query.eq("type", type);
    query = query.eq("isActive", true); // Only return active services
    const { data, error } = await query;
    if (error) throw error;
    
    // Transform data to include options as bullets for frontend compatibility
    const transformedData = (data || []).map(service => ({
      ...service,
      // Map service_options to bullets array for frontend compatibility
      bullets: (service.service_options || [])
        .filter(opt => opt.isActive !== false)
        .map(opt => opt.name),
      // Also keep options array for direct access
      options: service.service_options || [],
    }));
    
    res.json({ data: transformedData });
  } catch (err) {
    console.error("[Services Route Error]", err.message);
    res.status(500).json({ message: err.message, data: [] });
  }
});

// GET /api/public/services/:id
router.get("/:id", async (req,res) => {
  try {
    const { id } = req.params;
    // Include service options (subservices) in the query
    const { data, error } = await supabaseAdmin
      .from("services")
      .select(`
        *,
        service_options(
          id,
          name,
          description,
          price,
          priceModifier,
          duration,
          isActive
        )
      `)
      .eq("id", id)
      .eq("isActive", true)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ message: "Service not found", data: null });
    }
    
    // Transform data to include options as bullets for frontend compatibility
    const transformedData = {
      ...data,
      // Map service_options to bullets array for frontend compatibility
      bullets: (data.service_options || [])
        .filter(opt => opt.isActive !== false)
        .map(opt => opt.name),
      // Also keep options array for direct access
      options: data.service_options || [],
    };
    
    res.json({ data: transformedData });
  } catch(err) {
    console.error("[Service Detail Error]", err.message);
    res.status(500).json({ message: err.message, data: null });
  }
});

export default router;

