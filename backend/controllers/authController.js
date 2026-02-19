const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { User } = require('../models');
const { Op } = require('sequelize');
const { sendVerificationEmail } = require('../services/emailService');
const { generateOTPWith10MinExpiration, isOTPExpired } = require('../utils/otpGenerator');

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

// Register new student
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user (verified by default)
    const user = await User.create({
      email,
      password,
      name,
      role: 'student',
      isEmailVerified: true,
      isVerified: true
    });

    // Generate tokens for immediate login
    const { accessToken, refreshToken } = generateTokens(user.id);
    
    // Update user with refresh token and last login
    await user.update({ 
      refreshToken,
      lastLoginAt: new Date()
    });

    res.status(201).json({
      message: 'Registration successful',
      user: user.toJSON(),
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is verified (bypass for admin accounts)
    if (!user.isVerified && user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Account not verified. Please check your email and verify your account.',
        requiresEmailVerification: true
      });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);
    
    // Update user with refresh token and last login
    await user.update({ 
      refreshToken,
      lastLoginAt: new Date()
    });

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// Refresh access token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    
    // Find user and verify refresh token
    const user = await User.findByPk(decoded.userId);
    if (!user || user.refreshToken !== refreshToken || !user.isActive) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // Generate new tokens
    const tokens = generateTokens(user.id);
    
    // Update refresh token
    await user.update({ refreshToken: tokens.refreshToken });

    res.json({
      message: 'Token refreshed successfully',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(403).json({ message: 'Invalid refresh token' });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    const user = req.user;
    
    // Clear refresh token
    await user.update({ refreshToken: null });

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed', error: error.message });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'refreshToken'] }
    });

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get profile', error: error.message });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name } = req.body;
    const user = req.user;

    await user.update({ name });

    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

// Send email verification
const sendEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate secure 6-digit OTP with 10-minute expiration
    const { otp: verificationCode, expiresAt } = generateOTPWith10MinExpiration();

    // Update user with OTP and expiry
    await user.update({
      otp: verificationCode,
      otpExpiry: expiresAt
    });

    // Send verification email with 6-digit OTP
    try {
      const emailResult = await sendVerificationEmail(email, verificationCode, user.name);
      
      if (emailResult.success) {
        console.log('📧 Secure 6-digit OTP resent successfully to:', email);
        if (emailResult.previewUrl) {
          console.log('📧 Preview URL (development):', emailResult.previewUrl);
        }
      } else {
        console.log('⚠️ Email service failed, but OTP is secure');
        console.log('🔍 OTP stored in database, not exposed to frontend');
      }
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      console.log('🔍 OTP stored in database, not exposed to frontend');
    }

    // NEVER expose OTP to frontend - secure response only
    res.json({ 
      message: '6-digit code sent to your email. Check inbox/spam.'
    });
  } catch (error) {
    console.error('Send email verification error:', error);
    res.status(500).json({ message: 'Failed to send verification email' });
  }
};

// Verify email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Find user with verification token
    const user = await User.findOne({ 
      where: { 
        emailVerificationToken: token,
        emailVerificationExpires: {
          [Op.gte]: new Date()
        }
      } 
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    // Mark email as verified
    await user.update({
      emailVerificationToken: null,
      emailVerificationExpires: null,
      isEmailVerified: true
    });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Failed to verify email' });
  }
};

// Verify email with code
const verifyEmailWithCode = async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    // Find user with verification token
    const user = await User.findOne({ 
      where: { 
        email,
        emailVerificationToken: verificationCode,
        emailVerificationExpires: {
          [Op.gte]: new Date()
        }
      } 
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Mark email as verified
    await user.update({
      emailVerificationToken: null,
      emailVerificationExpires: null,
      isEmailVerified: true
    });

    res.json({ 
      message: 'Email verified successfully! You can now login.',
      isEmailVerified: true
    });
  } catch (error) {
    console.error('Verify email with code error:', error);
    res.status(500).json({ message: 'Failed to verify email' });
  }
};

// Verify OTP and activate account (POST /auth/verify)
const verifyOTP = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, otp } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already verified
    if (user.isVerified) {
      return res.status(400).json({ message: 'Account already verified' });
    }

    // Validate OTP format
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: 'Invalid OTP format. Must be 6 digits.' });
    }

    // Check if OTP matches and is not expired
    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (isOTPExpired(user.otpExpiry)) {
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }

    // Activate account and clear OTP
    await user.update({
      otp: null,
      otpExpiry: null,
      isVerified: true,
      isEmailVerified: true
    });

    // Generate JWT tokens for immediate login
    const { accessToken, refreshToken } = generateTokens(user.id);
    
    // Update user with refresh token and last login
    await user.update({ 
      refreshToken,
      lastLoginAt: new Date()
    });

    console.log('✅ Account verified and logged in:', email);

    res.json({
      message: 'Account verified successfully!',
      user: user.toJSON(),
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Failed to verify OTP', error: error.message });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  sendEmailVerification,
  verifyEmail,
  verifyEmailWithCode,
  verifyOTP
};