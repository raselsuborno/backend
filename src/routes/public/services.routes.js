import express from "express";
import { supabaseAdmin } from "../../lib/supabase.js";
const router = express.Router();

// GET /api/public/services?type=RESIDENTIAL
router.get("/", async (req, res) => {
  const { type } = req.query;
  try {
    let query = supabaseAdmin.from("services").select("*");
    if (type) query = query.eq("type", type);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ data: data || [] });
  } catch (err) {
    console.error("[Services Route Error]", err.message);
    res.status(500).json({ message: err.message, data: [] });
  }
});

// GET /api/public/services/:id
router.get("/:id", async (req,res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin.from("services").select("*").eq("id", id).single();
    if (error) throw error;
    res.json({ data: data || null });
  } catch(err) {
    console.error("[Service Detail Error]", err.message);
    res.status(500).json({ message: err.message, data: null });
  }
});

export default router;

