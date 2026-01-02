import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import prisma from "../lib/prisma.js";

const router = express.Router();

router.get("/me", requireAuth, async (req, res) => {
  try {
    if (!prisma) {
      return res.status(503).json({ message: 'Database not available' });
    }

    // Find or create profile for this user
    let profile = await prisma.profile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile) {
      // Auto-create profile if missing
      profile = await prisma.profile.create({
        data: {
          userId: req.user.id,
          email: req.user.email || "",
          role: "CUSTOMER",
          fullName: req.user.user_metadata?.name || null,
        },
      });
    }

    // Return profile data with all fields
    res.json({
      id: profile.id,
      userId: profile.userId,
      email: profile.email || req.user.email,
      fullName: profile.fullName,
      name: profile.fullName, // Alias for compatibility
      role: profile.role,
      phone: profile.phone,
      street: profile.street,
      unit: profile.unit,
      city: profile.city,
      province: profile.province,
      postal: profile.postal,
      country: profile.country,
      profilePicUrl: profile.profilePicUrl,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    });
  } catch (error) {
    console.error("[Profile] Error in /me:", error);
    res.status(500).json({ message: "Failed to load profile" });
  }
});

// PUT /api/profile - Update profile
router.put("/", requireAuth, async (req, res) => {
  try {
    if (!prisma) {
      return res.status(503).json({ message: 'Database not available' });
    }

    const {
      fullName,
      name,
      phone,
      street,
      unit,
      city,
      province,
      postal,
      country,
      profilePicUrl,
    } = req.body;

    // Get or create profile
    let profile = await prisma.profile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          userId: req.user.id,
          email: req.user.email || "",
          role: "CUSTOMER",
        },
      });
    }

    // Update profile
    const updateData = {
      fullName: fullName !== undefined ? fullName : name !== undefined ? name : profile.fullName,
      phone: phone !== undefined ? phone : profile.phone,
      street: street !== undefined ? street : profile.street,
      unit: unit !== undefined ? unit : profile.unit,
      city: city !== undefined ? city : profile.city,
      province: province !== undefined ? province : profile.province,
      postal: postal !== undefined ? postal : profile.postal,
      country: country !== undefined ? country : profile.country,
    };

    // Only update profilePicUrl if it's provided (not undefined)
    // This allows clearing the picture by sending null or empty string
    if (profilePicUrl !== undefined) {
      updateData.profilePicUrl = profilePicUrl || null;
    }

    console.log("[Profile] Updating profile:", {
      userId: req.user.id,
      hasProfilePicUrl: profilePicUrl !== undefined,
      profilePicUrlLength: profilePicUrl?.length || 0,
    });

    profile = await prisma.profile.update({
      where: { userId: req.user.id },
      data: updateData,
    });

    // Return updated profile
    res.json({
      id: profile.id,
      userId: profile.userId,
      email: profile.email,
      fullName: profile.fullName,
      name: profile.fullName,
      role: profile.role,
      phone: profile.phone,
      street: profile.street,
      unit: profile.unit,
      city: profile.city,
      province: profile.province,
      postal: profile.postal,
      country: profile.country,
      profilePicUrl: profile.profilePicUrl,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    });
  } catch (error) {
    console.error("[Profile] Error in PUT /:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

export default router;


