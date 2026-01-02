import prisma from '../../lib/prisma.js';
import { supabaseAdmin } from '../../lib/supabase.js';

export const applyForWorker = async (req, res, next) => {
  try {
    const { email, fullName, phone, password, confirmPassword } = req.body;

    if (!email || !fullName || !password) {
      return res.status(400).json({ message: 'Email, full name, and password are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if email already has a pending application
    const existingApplication = await prisma.workerApplication.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        status: 'PENDING',
      },
    });

    if (existingApplication) {
      return res.status(409).json({ 
        message: 'You already have a pending application. Please wait for review.' 
      });
    }

    // 1. Create Supabase auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return res.status(409).json({ message: 'This email is already registered. Please log in.' });
      }
      console.error('[Worker Apply] Supabase auth error:', authError);
      return res.status(400).json({ message: authError.message || 'Failed to create account' });
    }

    // 2. Create Profile with CUSTOMER role initially
    const profile = await prisma.profile.create({
      data: {
        userId: authData.user.id,
        email: email.toLowerCase().trim(),
        fullName: fullName.trim(),
        phone: phone?.trim() || null,
        role: 'CUSTOMER',
      },
    });

    // 3. Create WorkerApplication
    const application = await prisma.workerApplication.create({
      data: {
        profileId: profile.id,
        email: email.toLowerCase().trim(),
        fullName: fullName.trim(),
        phone: phone?.trim() || null,
        status: 'PENDING',
      },
    });

    res.status(201).json({
      message: 'Application submitted successfully! You can log in and track your application status.',
      application: {
        id: application.id,
        email: application.email,
        status: application.status,
      },
    });
  } catch (error) {
    console.error('[Worker Apply] Error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Application already exists for this email' });
    }
    next(error);
  }
};
