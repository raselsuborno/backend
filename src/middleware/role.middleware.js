import prisma from '../lib/prisma.js';

const roleMiddleware = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(403).json({ message: 'User not authenticated' });
      }

      // Get user profile to check role
      const profile = await prisma.profile.findUnique({
        where: { userId: req.user.id },
        select: { role: true },
      });

      if (!profile) {
        return res.status(403).json({ message: 'User profile not found' });
      }

      const userRole = profile.role;
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      
      if (!roles.includes(userRole)) {
        return res.status(403).json({ 
          message: 'Insufficient permissions' 
        });
      }
      
      // Attach role to req.user for convenience
      req.user.role = userRole;
      
      next();
    } catch (error) {
      console.error('[Role Middleware] Error:', error);
      res.status(403).json({ message: 'Authorization failed' });
    }
  };
};

export default roleMiddleware;

