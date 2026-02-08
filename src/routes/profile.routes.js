import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { supabaseAdmin } from "../lib/supabase.js";

const router = express.Router();

router.get("/me", requireAuth, async (req, res) => {
  try {
    // Find or create profile for this user
    let { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('userId', req.user.id)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      // Profile doesn't exist, create it
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({
          userId: req.user.id,
          email: req.user.email || "",
          role: "CUSTOMER",
          fullName: req.user.user_metadata?.name || null,
        })
        .select()
        .single();

      if (createError) throw createError;
      profile = newProfile;
    } else if (fetchError) {
      throw fetchError;
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
    res.status(500).json({ message: "Failed to load profile", data: null });
  }
});

// PUT /api/profile - Update profile
router.put("/", requireAuth, async (req, res) => {
  try {
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
    let { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('userId', req.user.id)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      // Profile doesn't exist, create it
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({
          userId: req.user.id,
          email: req.user.email || "",
          role: "CUSTOMER",
        })
        .select()
        .single();

      if (createError) throw createError;
      profile = newProfile;
    } else if (fetchError) {
      throw fetchError;
    }

    // Prepare update data
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

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('userId', req.user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Return updated profile
    res.json({
      id: updatedProfile.id,
      userId: updatedProfile.userId,
      email: updatedProfile.email,
      fullName: updatedProfile.fullName,
      name: updatedProfile.fullName,
      role: updatedProfile.role,
      phone: updatedProfile.phone,
      street: updatedProfile.street,
      unit: updatedProfile.unit,
      city: updatedProfile.city,
      province: updatedProfile.province,
      postal: updatedProfile.postal,
      country: updatedProfile.country,
      profilePicUrl: updatedProfile.profilePicUrl,
      createdAt: updatedProfile.createdAt,
      updatedAt: updatedProfile.updatedAt,
    });
  } catch (error) {
    console.error("[Profile] Error in PUT /:", error);
    res.status(500).json({ message: "Failed to update profile", data: null });
  }
});

export default router;


