import prisma from '../lib/prisma.js';

/**
 * requireRole - Role-based access control middleware
 * 
 * ASSUMES: requireAuth middleware has already run and req.user exists
 * 
 * Usage:
 *   router.get('/admin/*', requireAuth, requireRole(['admin']), controller)
 *   router.get('/worker/*', requireAuth, requireRole(['worker', 'admin']), controller)
 * 
 * This middleware:
 * 1. Fetches user profile from database (if not already attached)
 * 2. Checks if user's role is in the allowed roles array
 * 3. Returns 403 if role doesn't match
 * 4. Attaches profile to req.user.profile for downstream use
 * 
 * Role values (from Prisma schema):
 * - "CUSTOMER" (default)
 * - "WORKER" (future)
 * - "ADMIN" (future)
 */
export const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Ensure requireAuth ran first
      if (!req.user || !req.user.id) {
        return res.status(401).json({ 
          message: 'Authentication required. requireAuth middleware must run first.' 
        });
      }

      // Always fetch fresh profile from database to ensure latest role
      // This prevents stale cached roles after database updates
      const profile = await prisma.profile.findUnique({
        where: { userId: req.user.id },
        select: { 
          id: true,
          role: true,
          email: true,
          fullName: true,
        },
      });

      if (!profile) {
        return res.status(403).json({ 
          message: 'User profile not found. Please complete your profile setup.' 
        });
      }

      // Always update req.user.profile with fresh data
      req.user.profile = profile;

      // Normalize role to uppercase (schema uses uppercase)
      const userRole = profile.role?.toUpperCase();
      
      // Normalize allowed roles to uppercase array
      const normalizedAllowedRoles = Array.isArray(allowedRoles) 
        ? allowedRoles.map(r => r.toUpperCase())
        : [allowedRoles.toUpperCase()];

      // Debug logging
      console.log('[requireRole] Role authorization check:', {
        userId: req.user.id,
        userEmail: req.user.email,
        profileId: profile.id,
        profileEmail: profile.email,
        profileRole: profile.role,
        userRole,
        allowedRoles: normalizedAllowedRoles,
        authorized: normalizedAllowedRoles.includes(userRole),
      });

      // Check if user's role is allowed
      if (!normalizedAllowedRoles.includes(userRole)) {
        console.warn('[requireRole] Access denied:', {
          userId: req.user.id,
          email: req.user.email,
          expectedRole: normalizedAllowedRoles,
          actualRole: userRole,
          profileFromDB: profile.role,
        });
        return res.status(403).json({ 
          message: `Access denied. Required role: ${normalizedAllowedRoles.join(' or ')}. Your role: ${userRole || 'none'}. Please ensure your profile has the correct role set in the database.` 
        });
      }

      // Role check passed - continue
      next();
    } catch (error) {
      console.error('[requireRole] Error:', error);
      res.status(500).json({ message: 'Authorization check failed' });
    }
  };
};

