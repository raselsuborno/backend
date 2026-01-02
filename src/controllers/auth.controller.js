import supabase from '../lib/supabase.js';

export const getMe = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.replace("Bearer ", "");

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    return res.json({
      id: data.user.id,
      email: data.user.email,
      role: "USER", // hardcode for now
    });
  } catch (err) {
    console.error("getMe error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const authController = {
  register: async (req, res, next) => {
    try {
      const { email, password, name } = req.body;
      
      // Validation
      if (!email || !password) {
        console.log('[Register] Validation failed: Missing email or password');
        return res.status(400).json({
          message: 'Email and password are required'
        });
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log('[Register] Validation failed: Invalid email format');
        return res.status(400).json({
          message: 'Invalid email format'
        });
      }

      // Password length validation
      if (password.length < 6) {
        console.log('[Register] Validation failed: Password too short');
        return res.status(400).json({
          message: 'Password must be at least 6 characters'
        });
      }

      console.log('[Register] Attempting to sign up user:', email);

      // Call Supabase auth.signUp
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || null
          }
        }
      });

      // Handle Supabase errors
      if (error) {
        console.error('[Register] Supabase error:', error.message);
        
        // Check for duplicate user error
        if (error.message.includes('already registered') || 
            error.message.includes('already exists') ||
            error.message.includes('User already registered')) {
          return res.status(409).json({
            message: 'User with this email already exists'
          });
        }

        // Other Supabase errors
        return res.status(400).json({
          message: error.message || 'Registration failed'
        });
      }

      // Check if data is null or user is null
      if (!data || !data.user) {
        console.error('[Register] No user data returned from Supabase');
        return res.status(500).json({
          message: 'Registration failed: No user data returned'
        });
      }

      console.log('[Register] User registered successfully:', data.user.id);

      // Return success response
      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || null
        }
      });
    } catch (error) {
      console.error('[Register] Unexpected error:', error);
      // Only call next for unexpected errors (not Supabase errors)
      next(error);
    }
  },

  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      
      // TODO: Implement login logic with Supabase
      // const { data, error } = await authService.signIn(email, password);
      
      res.json({
        message: 'Login successful',
        // data
      });
    } catch (error) {
      next(error);
    }
  },

  refreshToken: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      
      // TODO: Implement token refresh logic
      res.json({
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  getMe: async (req, res, next) => {
    try {
      // req.user is set by authMiddleware
      const user = req.user;
      
      res.json({
        user
      });
    } catch (error) {
      next(error);
    }
  },

  logout: async (req, res, next) => {
    try {
      // TODO: Implement logout logic
      res.json({
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  }
};

export default authController;

