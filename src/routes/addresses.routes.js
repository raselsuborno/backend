import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import addressesController from "../controllers/addresses.controller.js";

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/addresses - Get all user addresses
router.get("/", addressesController.getAddresses);

// GET /api/addresses/:id - Get address by ID
router.get("/:id", addressesController.getAddressById);

// POST /api/addresses - Create new address
router.post("/", addressesController.createAddress);

// PUT /api/addresses/:id - Update address
router.put("/:id", addressesController.updateAddress);

// DELETE /api/addresses/:id - Delete address
router.delete("/:id", addressesController.deleteAddress);

// POST /api/addresses/:id/set-default - Set address as default
router.post("/:id/set-default", addressesController.setDefaultAddress);

export default router;


