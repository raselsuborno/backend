import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import bookingsController from "../controllers/bookings.controller.js";
import { supabaseAdmin } from "../lib/supabase.js";

const router = express.Router();

// GET /api/bookings - Get all bookings
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from("bookings").select("*");
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/bookings/mine - Get user's bookings
router.get("/mine", requireAuth, bookingsController.getMine);

// GET /api/bookings/:id - Get booking by ID
router.get("/:id", requireAuth, bookingsController.getBookingById);

// POST /api/bookings - Create booking (authenticated user)
router.post("/", requireAuth, bookingsController.createBooking);

// POST /api/bookings/guest - Create guest booking (no auth required)
router.post("/guest", bookingsController.createGuestBooking);

// PUT /api/bookings/:id - Update booking
router.put("/:id", requireAuth, bookingsController.updateBooking);

// DELETE /api/bookings/:id - Cancel booking
router.delete("/:id", requireAuth, bookingsController.cancelBooking);

// POST /api/bookings/:id/rebook - Rebook a cancelled booking
router.post("/:id/rebook", requireAuth, bookingsController.rebookBooking);

// POST /api/bookings/:id/reschedule - Reschedule a booking
router.post("/:id/reschedule", requireAuth, bookingsController.rescheduleBooking);

// POST /api/bookings/:id/favorite - Toggle favorite status
router.post("/:id/favorite", requireAuth, bookingsController.toggleFavorite);

export default router;

