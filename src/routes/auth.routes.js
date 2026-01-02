import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/me", requireAuth, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
  });
});

export default router;

