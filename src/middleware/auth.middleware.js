import supabase from "../lib/supabase.js";
import prisma from "../lib/prisma.js";

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.replace("Bearer ", "");

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    req.user = data.user;

    // Attach profile to req.user
    try {
      const profile = await prisma.profile.findUnique({
        where: { userId: data.user.id },
        select: {
          id: true,
          role: true,
          email: true,
          fullName: true,
        },
      });
      req.user.profile = profile;
      
      // Debug logging
      if (profile) {
        console.log('[requireAuth] Profile attached:', {
          userId: data.user.id,
          email: data.user.email,
          profileId: profile.id,
          profileRole: profile.role,
        });
      }
      
      // Debug logging
      console.log('[requireAuth] Profile loaded:', {
        userId: data.user.id,
        email: data.user.email,
        profileId: profile?.id,
        profileRole: profile?.role,
      });
    } catch (profileError) {
      console.warn("Profile fetch error in requireAuth:", profileError);
      // Continue without profile - downstream code can handle
    }

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ message: "Auth verification failed" });
  }
};

// Optional auth - attaches user if token exists, but doesn't require it
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token provided - continue without auth
      req.user = null;
      return next();
    }

    const token = authHeader.replace("Bearer ", "");    const { data, error } = await supabase.auth.getUser(token);    if (error || !data?.user) {
      // Invalid token - continue without auth
      req.user = null;
      return next();
    }    req.user = data.user;
    next();
  } catch (err) {
    // On error, continue without auth
    console.warn("Optional auth middleware warning:", err);
    req.user = null;
    next();
  }
};
