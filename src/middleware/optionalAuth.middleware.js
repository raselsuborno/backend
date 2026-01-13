import supabase from "../lib/supabase.js";

// Optional auth middleware - attaches user if token is valid, but doesn't fail if missing
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = authHeader.replace("Bearer ", "");

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      req.user = null;
      return next();
    }

    req.user = data.user;
    next();
  } catch (err) {
    console.error("Optional auth middleware error:", err);
    req.user = null;
    next();
  }
};



